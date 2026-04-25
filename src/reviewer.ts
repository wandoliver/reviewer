import { env, requireOpenAiApiKey } from "./config.js";
import { buildResponseMetadata, type OpenAiUsagePayload } from "./metadata.js";
import { buildReviewInput, buildSystemPrompt } from "./prompt.js";
import { UpstreamApiError } from "./errors.js";
import { reviewResponseJsonSchema, validateReviewRequest, validateReviewResponse } from "./validation.js";
import type { ReviewRequest, ReviewResponse } from "./types.js";

interface OpenAIResponsesApiResult {
  id?: string;
  usage?: OpenAiUsagePayload;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

function extractOutputText(payload: OpenAIResponsesApiResult): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim() !== "") {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string" && content.text.trim() !== "") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text");
}

export async function review(input: ReviewRequest): Promise<ReviewResponse> {
  const request = validateReviewRequest(input);
  const startedAt = Date.now();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireOpenAiApiKey()}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildSystemPrompt(request)
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildReviewInput(request)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "review_response",
          strict: true,
          schema: reviewResponseJsonSchema
        }
      }
    })
  });

  if (!response.ok) {
    const bodyText = await response.text();
    let code: string | undefined;
    let type: string | undefined;
    let message = `OpenAI API error ${response.status}`;

    try {
      const parsed = JSON.parse(bodyText) as { error?: { code?: string; type?: string; message?: string } };
      code = parsed.error?.code;
      type = parsed.error?.type;
      message = parsed.error?.message ?? message;
    } catch {
      message = `${message}: ${bodyText}`;
    }

    throw new UpstreamApiError(message, response.status, code, type);
  }

  const payload = (await response.json()) as OpenAIResponsesApiResult;
  const text = extractOutputText(payload);
  const parsed = JSON.parse(text) as unknown;
  const result = validateReviewResponse(parsed);

  result.metadata = buildResponseMetadata({
    startedAt,
    responseId: payload.id,
    usage: payload.usage
  });

  return result;
}
