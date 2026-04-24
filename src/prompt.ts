import type { ReviewRequest } from "./types.js";
import { modePromptAddon, normalizeMode } from "./modes.js";

function renderFiles(request: ReviewRequest): string {
  if (!request.files?.length) {
    return "";
  }

  return request.files
    .map((file) => `### File: ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``)
    .join("\n\n");
}

export function buildReviewInput(request: ReviewRequest): string {
  const effectiveMode = normalizeMode(request.mode);

  const sections = [
    `Mode: ${effectiveMode}`,
    request.title ? `Title: ${request.title}` : null,
    request.context?.repo ? `Repo: ${request.context.repo}` : null,
    request.context?.branch ? `Branch: ${request.context.branch}` : null,
    request.context?.commit ? `Commit: ${request.context.commit}` : null,
    request.context?.review_style ? `Review style: ${request.context.review_style}` : null,
    request.context?.extra_instructions ? `Extra instructions: ${request.context.extra_instructions}` : null,
    request.content ? `## Content\n\n${request.content}` : null,
    request.diff ? `## Diff\n\n\`\`\`diff\n${request.diff}\n\`\`\`` : null,
    renderFiles(request)
  ].filter(Boolean);

  return sections.join("\n\n");
}

export const REVIEWER_SYSTEM_PROMPT = `
You are a senior software review agent.

Your default stance is code review:
- Prioritize bugs, risks, behavioral regressions, missing tests, incorrect assumptions, and rollout hazards.
- Findings come first.
- Keep summaries brief and secondary.
- If no issues are found, say so plainly.

Review style:
- Be direct and technical.
- Prefer concrete defects over generic "best practice" commentary.
- Do not pad with low-value advice such as "add docs", "add logging", or "consider performance" unless the input actually shows that gap matters.
- If a plan or change only provides weak evidence, identify the missing evidence instead of inventing certainty.
- If the issue is branch coverage or wiring parity, say that explicitly.

Output rules:
- Respond only as valid JSON matching the provided schema.
- Do not wrap JSON in markdown.
- Be concrete and technical.
- Reference file paths and line hints when the input provides them.
- Do not invent files or code that are not present in the input.

Severity guidance:
- critical: likely security/data-loss/outage issue
- high: substantial correctness or rollout risk
- medium: meaningful but contained issue
- low: minor issue or notable gap

Review philosophy:
- Prefer precision over volume.
- Do not nitpick style unless it hides real risk.
- If the request is a plan or design doc, review it the same way: look for mismatches with likely implementation, missing invariants, unhandled branches, and weak verification.
`.trim();

export function buildSystemPrompt(request: ReviewRequest): string {
  return `${REVIEWER_SYSTEM_PROMPT}\n\n${modePromptAddon(request.mode)}`;
}
