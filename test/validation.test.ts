import test from "node:test";
import assert from "node:assert/strict";
import { RequestValidationError } from "../src/errors.js";
import {
  reviewResponseJsonSchema,
  validateDiffReviewRequest,
  validateFileReviewRequest,
  validateReviewRequest,
  validateReviewResponse
} from "../src/validation.js";

test("validateReviewRequest accepts minimal text review request", () => {
  const result = validateReviewRequest({
    mode: "text",
    content: "hello"
  });

  assert.equal(result.mode, "text");
  assert.equal(result.content, "hello");
});

test("validateReviewRequest rejects missing payload", () => {
  assert.throws(
    () => validateReviewRequest({ mode: "text" }),
    (error: unknown) =>
      error instanceof RequestValidationError &&
      error.message === "At least one of content, diff, or files must be provided."
  );
});

test("validateReviewRequest accepts reviewer modes", () => {
  const result = validateReviewRequest({
    mode: "strict_review",
    diff: "diff --git a/x b/x"
  });

  assert.equal(result.mode, "strict_review");
});

test("validateFileReviewRequest defaults to code_review mode", () => {
  const result = validateFileReviewRequest({
    path: "src/app.ts",
    content: "export const x = 1;"
  });

  assert.equal(result.mode, "code_review");
  assert.equal(result.files?.[0]?.path, "src/app.ts");
});

test("validateDiffReviewRequest defaults to code_review mode", () => {
  const result = validateDiffReviewRequest({
    diff: "diff --git a/a.ts b/a.ts"
  });

  assert.equal(result.mode, "code_review");
  assert.equal(result.title, "diff review");
});

test("validateReviewResponse accepts valid structured review", () => {
  const result = validateReviewResponse({
    summary: "1 issue found",
    findings: [
      {
        severity: "high",
        title: "Bug",
        body: "Something is wrong",
        references: ["src/app.ts:10"]
      }
    ],
    open_questions: ["Is this intentional?"],
    change_summary: "Mostly okay",
    metadata: {
      model: "gpt-5",
      duration_ms: 123,
      response_id: "resp_123",
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30
      }
    }
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0]?.severity, "high");
  assert.equal(result.metadata?.model, "gpt-5");
});

test("reviewResponseJsonSchema exposes required top-level keys", () => {
  assert.deepEqual(reviewResponseJsonSchema.required, [
    "summary",
    "findings",
    "open_questions",
    "change_summary"
  ]);
  assert.equal("metadata" in reviewResponseJsonSchema.properties, false);
});
