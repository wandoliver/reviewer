import type { ReviewMode } from "./types.js";

export function normalizeMode(mode: ReviewMode): "plan" | "diff" | "file" | "text" | "code" | "strict" {
  switch (mode) {
    case "plan_review":
      return "plan";
    case "code_review":
      return "code";
    case "strict_review":
      return "strict";
    default:
      return mode;
  }
}

export function modePromptAddon(mode: ReviewMode): string {
  const normalized = normalizeMode(mode);

  switch (normalized) {
    case "plan":
      return `
Plan review mode:
- Treat the input as a design or implementation plan.
- Prioritize hidden branches, missing invariants, rollout hazards, skipped wiring points, and weak verification.
- Prefer concrete plan defects over generic engineering advice.
- Do not ask for tests in the abstract; explain which behavior needs to be pinned down and why.`.trim();
    case "code":
    case "diff":
    case "file":
      return `
Code review mode:
- Lead with likely bugs, regressions, and missing tests.
- Focus on changed behavior, duplicated logic, state transitions, auth/permission edges, and rollout impact.
- Avoid broad style commentary unless it creates risk.
- If the input includes file paths or diffs, use them in references when you make a concrete finding.`.trim();
    case "strict":
      return `
Strict review mode:
- Be conservative.
- Treat duplicated logic, incomplete migration wiring, weak tests, unclear ownership, or hand-wavy rollout plans as real problems.
- Do not soften a finding just because the change is small.
- If the evidence is insufficient, say what is missing instead of filling the gap with generic advice.`.trim();
    case "text":
    default:
      return `
Text review mode:
- Review the provided text directly.
- If the text is too thin for a strong conclusion, say so and keep the output tight.
- Do not manufacture implementation details that are not in the input.`.trim();
  }
}
