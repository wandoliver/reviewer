import type {
  ReviewFileInput,
  ReviewFinding,
  ReviewMode,
  ReviewRequest,
  ReviewResponse,
  ReviewSeverity
} from "./types.js";
import { RequestValidationError } from "./errors.js";

const REVIEW_MODES = new Set<ReviewMode>(["plan", "diff", "file", "text", "plan_review", "code_review", "strict_review"]);
const SEVERITIES = new Set<ReviewSeverity>(["critical", "high", "medium", "low"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function ensureStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every(isString)) {
    throw new RequestValidationError(`${field} must be an array of strings`);
  }
  return value;
}

function validateFiles(value: unknown): ReviewFileInput[] {
  if (!Array.isArray(value)) {
    throw new RequestValidationError("files must be an array");
  }

  return value.map((item, index) => {
    if (!isObject(item) || !isString(item.path) || !item.path || !isString(item.content) || !item.content) {
      throw new RequestValidationError(`files[${index}] must contain non-empty path and content`);
    }

    return {
      path: item.path,
      content: item.content
    };
  });
}

function validateMode(value: unknown, fallback: ReviewMode): ReviewMode {
  if (value === undefined) {
    return fallback;
  }

  if (!isString(value) || !REVIEW_MODES.has(value as ReviewMode)) {
    throw new RequestValidationError("mode must be one of: plan, diff, file, text, plan_review, code_review, strict_review");
  }

  return value as ReviewMode;
}

function validateOptionalTitle(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isString(value) || value.length === 0 || value.length > 300) {
    throw new RequestValidationError("title must be a non-empty string up to 300 characters");
  }

  return value;
}

function validateOptionalContext(value: unknown): ReviewRequest["context"] {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw new RequestValidationError("context must be an object");
  }

  const context: NonNullable<ReviewRequest["context"]> = {};
  for (const key of ["repo", "review_style", "branch", "commit", "extra_instructions"] as const) {
    const item = value[key];
    if (item !== undefined) {
      if (!isString(item)) {
        throw new RequestValidationError(`context.${key} must be a string`);
      }
      context[key] = item;
    }
  }

  return context;
}

export function validateReviewRequest(value: unknown): ReviewRequest {
  if (!isObject(value)) {
    throw new RequestValidationError("request body must be a JSON object");
  }

  const request: ReviewRequest = {
    mode: validateMode(value.mode, "text")
  };

  const title = validateOptionalTitle(value.title);
  if (title !== undefined) {
    request.title = title;
  }

  if (value.content !== undefined) {
    if (!isString(value.content) || value.content.length === 0) {
      throw new RequestValidationError("content must be a non-empty string");
    }
    request.content = value.content;
  }

  if (value.diff !== undefined) {
    if (!isString(value.diff) || value.diff.length === 0) {
      throw new RequestValidationError("diff must be a non-empty string");
    }
    request.diff = value.diff;
  }

  if (value.files !== undefined) {
    request.files = validateFiles(value.files);
  }

  const context = validateOptionalContext(value.context);
  if (context !== undefined) {
    request.context = context;
  }

  if (!request.content && !request.diff && (!request.files || request.files.length === 0)) {
    throw new RequestValidationError("At least one of content, diff, or files must be provided.");
  }

  return request;
}

export function validateFileReviewRequest(value: unknown): ReviewRequest {
  if (!isObject(value)) {
    throw new RequestValidationError("request body must be a JSON object");
  }

  if (!isString(value.path) || value.path.length === 0) {
    throw new RequestValidationError("path must be a non-empty string");
  }

  if (!isString(value.content) || value.content.length === 0) {
    throw new RequestValidationError("content must be a non-empty string");
  }

  const title = validateOptionalTitle(value.title);
  const context = validateOptionalContext(value.context);

  return {
    mode: validateMode(value.mode, "code_review"),
    title: title ?? value.path,
    files: [
      {
        path: value.path,
        content: value.content
      }
    ],
    context
  };
}

export function validateDiffReviewRequest(value: unknown): ReviewRequest {
  if (!isObject(value)) {
    throw new RequestValidationError("request body must be a JSON object");
  }

  if (!isString(value.diff) || value.diff.length === 0) {
    throw new RequestValidationError("diff must be a non-empty string");
  }

  const title = validateOptionalTitle(value.title);
  const context = validateOptionalContext(value.context);

  return {
    mode: validateMode(value.mode, "code_review"),
    title: title ?? "diff review",
    diff: value.diff,
    context
  };
}

function validateFinding(value: unknown, index: number): ReviewFinding {
  if (!isObject(value)) {
    throw new Error(`findings[${index}] must be an object`);
  }
  if (!isString(value.severity) || !SEVERITIES.has(value.severity as ReviewSeverity)) {
    throw new Error(`findings[${index}].severity is invalid`);
  }
  if (!isString(value.title) || value.title.length === 0) {
    throw new Error(`findings[${index}].title must be a non-empty string`);
  }
  if (!isString(value.body) || value.body.length === 0) {
    throw new Error(`findings[${index}].body must be a non-empty string`);
  }

  const references = value.references === undefined ? [] : ensureStringArray(value.references, `findings[${index}].references`);

  return {
    severity: value.severity as ReviewSeverity,
    title: value.title,
    body: value.body,
    references
  };
}

export function validateReviewResponse(value: unknown): ReviewResponse {
  if (!isObject(value)) {
    throw new Error("review response must be an object");
  }
  if (!isString(value.summary) || value.summary.length === 0) {
    throw new Error("summary must be a non-empty string");
  }
  if (!Array.isArray(value.findings)) {
    throw new Error("findings must be an array");
  }
  if (!isString(value.change_summary) || value.change_summary.length === 0) {
    throw new Error("change_summary must be a non-empty string");
  }

  const openQuestions = value.open_questions === undefined ? [] : ensureStringArray(value.open_questions, "open_questions");
  let metadata: ReviewResponse["metadata"];

  if (value.metadata !== undefined) {
    if (!isObject(value.metadata)) {
      throw new Error("metadata must be an object");
    }
    if (!isString(value.metadata.model) || value.metadata.model.length === 0) {
      throw new Error("metadata.model must be a non-empty string");
    }
    if (typeof value.metadata.duration_ms !== "number") {
      throw new Error("metadata.duration_ms must be a number");
    }

    metadata = {
      model: value.metadata.model,
      duration_ms: value.metadata.duration_ms
    };

    if (value.metadata.response_id !== undefined) {
      if (!isString(value.metadata.response_id)) {
        throw new Error("metadata.response_id must be a string");
      }
      metadata.response_id = value.metadata.response_id;
    }

    if (value.metadata.usage !== undefined) {
      if (!isObject(value.metadata.usage)) {
        throw new Error("metadata.usage must be an object");
      }

      metadata.usage = {};
      for (const key of ["input_tokens", "output_tokens", "total_tokens"] as const) {
        const tokenValue = value.metadata.usage[key];
        if (tokenValue !== undefined) {
          if (typeof tokenValue !== "number") {
            throw new Error(`metadata.usage.${key} must be a number`);
          }
          metadata.usage[key] = tokenValue;
        }
      }
    }
  }

  return {
    summary: value.summary,
    findings: value.findings.map(validateFinding),
    open_questions: openQuestions,
    change_summary: value.change_summary,
    metadata
  };
}

export const reviewResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "findings", "open_questions", "change_summary"],
  properties: {
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "title", "body", "references"],
        properties: {
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"]
          },
          title: { type: "string" },
          body: { type: "string" },
          references: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    open_questions: {
      type: "array",
      items: { type: "string" }
    },
    change_summary: { type: "string" }
  }
} as const;
