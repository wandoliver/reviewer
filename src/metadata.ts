import { env } from "./config.js";
import type { ReviewMetadata } from "./types.js";

export interface OpenAiUsagePayload {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export function buildResponseMetadata(params: {
  startedAt: number;
  responseId?: string;
  usage?: OpenAiUsagePayload;
}): ReviewMetadata {
  return {
    model: env.OPENAI_MODEL,
    duration_ms: Date.now() - params.startedAt,
    response_id: params.responseId,
    usage: params.usage
      ? {
          input_tokens: params.usage.input_tokens,
          output_tokens: params.usage.output_tokens,
          total_tokens: params.usage.total_tokens
        }
      : undefined
  };
}
