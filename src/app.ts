import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { review } from "./reviewer.js";
import { env } from "./config.js";
import { validateDiffReviewRequest, validateFileReviewRequest, validateReviewRequest } from "./validation.js";
import { RequestValidationError, UpstreamApiError } from "./errors.js";
import { logEvent } from "./logging.js";
import type { ReviewRequest, ReviewResponse } from "./types.js";

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(reply: ServerResponse, statusCode: number, body: unknown): void {
  reply.statusCode = statusCode;
  reply.setHeader("Content-Type", "application/json");
  reply.end(JSON.stringify(body));
}

export interface AppDependencies {
  reviewFn?: (request: ReviewRequest) => Promise<ReviewResponse>;
  reviewerApiToken?: string;
}

export interface RequestLike {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: string;
}

export interface ResponseLike {
  statusCode: number;
  body: unknown;
}

function isAuthorized(headers: RequestLike["headers"], reviewerApiToken?: string): boolean {
  if (!reviewerApiToken) {
    return true;
  }

  const authHeader = headers.authorization;
  const apiTokenHeader = headers["x-api-token"];

  if (typeof apiTokenHeader === "string" && apiTokenHeader === reviewerApiToken) {
    return true;
  }

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7) === reviewerApiToken;
  }

  return false;
}

export async function handleRequest(request: RequestLike, deps: AppDependencies = {}): Promise<ResponseLike> {
  const startedAt = Date.now();
  const method = request.method ?? "GET";
  const url = request.url ?? "/";
  const reviewFn = deps.reviewFn ?? review;
  const reviewerApiToken = deps.reviewerApiToken ?? env.REVIEWER_API_TOKEN;
  let mode: string | undefined;

  if (method === "GET" && url === "/health") {
    return { statusCode: 200, body: { ok: true } };
  }

  if (!isAuthorized(request.headers, reviewerApiToken)) {
    return { statusCode: 401, body: { error: "Unauthorized" } };
  }

  if (method === "POST" && (url === "/review" || url === "/review/file" || url === "/review/diff")) {
    try {
      const body = request.body ? JSON.parse(request.body) : {};
      const parsed =
        url === "/review/file"
          ? validateFileReviewRequest(body)
          : url === "/review/diff"
            ? validateDiffReviewRequest(body)
            : validateReviewRequest(body);
      mode = parsed.mode;
      const result = await reviewFn(parsed);
      logEvent({
        timestamp: new Date().toISOString(),
        method,
        path: url,
        mode,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
        outcome: "ok"
      });
      return { statusCode: 200, body: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      let statusCode = 500;
      let errorLabel = "Review failed";

      if (error instanceof RequestValidationError || error instanceof SyntaxError) {
        statusCode = 400;
        errorLabel = "Invalid review request";
      } else if (error instanceof UpstreamApiError) {
        errorLabel = "OpenAI request failed";
        if (error.code === "insufficient_quota") {
          statusCode = 503;
        } else if (error.statusCode === 401 || error.statusCode === 403) {
          statusCode = 502;
        } else if (error.statusCode === 429) {
          statusCode = 503;
        } else {
          statusCode = 502;
        }
      }

      logEvent({
        timestamp: new Date().toISOString(),
        method,
        path: url,
        mode,
        statusCode,
        durationMs: Date.now() - startedAt,
        outcome: statusCode >= 500 ? "server_error" : "client_error"
      });

      return {
        statusCode,
        body: {
          error: errorLabel,
          details: message
        }
      };
    }
  }

  return { statusCode: 404, body: { error: "Not found" } };
}

export function buildApp(deps: AppDependencies = {}) {
  return createServer(async (request, reply) => {
    const body = request.method === "POST" ? JSON.stringify(await readJsonBody(request)) : undefined;
    const result = await handleRequest(
      {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body
      },
      deps
    );
    return sendJson(reply, result.statusCode, result.body);
  });
}
