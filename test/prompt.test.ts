import test from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt } from "../src/prompt.js";
import type { ReviewRequest } from "../src/types.js";

function makeRequest(mode: ReviewRequest["mode"]): ReviewRequest {
  return {
    mode,
    content: "x"
  };
}

test("plan review prompt includes plan-specific guidance", () => {
  const prompt = buildSystemPrompt(makeRequest("plan_review"));
  assert.match(prompt, /Plan review mode:/);
  assert.match(prompt, /hidden branches/i);
});

test("code review prompt includes code-specific guidance", () => {
  const prompt = buildSystemPrompt(makeRequest("code_review"));
  assert.match(prompt, /Code review mode:/);
  assert.match(prompt, /regressions/i);
});

test("strict review prompt includes stricter tolerance guidance", () => {
  const prompt = buildSystemPrompt(makeRequest("strict_review"));
  assert.match(prompt, /Strict review mode:/);
  assert.match(prompt, /duplicated logic/i);
});
