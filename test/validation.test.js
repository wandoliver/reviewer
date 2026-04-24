import test from "node:test";
import assert from "node:assert/strict";
import { RequestValidationError } from "../src/errors.js";
import { reviewResponseJsonSchema, validateReviewRequest, validateReviewResponse } from "../src/validation.js";
test("validateReviewRequest accepts minimal text review request", () => {
    const result = validateReviewRequest({
        mode: "text",
        content: "hello"
    });
    assert.equal(result.mode, "text");
    assert.equal(result.content, "hello");
});
test("validateReviewRequest rejects missing payload", () => {
    assert.throws(() => validateReviewRequest({ mode: "text" }), (error) => error instanceof RequestValidationError &&
        error.message === "At least one of content, diff, or files must be provided.");
});
test("validateReviewRequest accepts reviewer modes", () => {
    const result = validateReviewRequest({
        mode: "strict_review",
        diff: "diff --git a/x b/x"
    });
    assert.equal(result.mode, "strict_review");
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
        change_summary: "Mostly okay"
    });
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0]?.severity, "high");
});
test("reviewResponseJsonSchema exposes required top-level keys", () => {
    assert.deepEqual(reviewResponseJsonSchema.required, [
        "summary",
        "findings",
        "open_questions",
        "change_summary"
    ]);
});
//# sourceMappingURL=validation.test.js.map