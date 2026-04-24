import type { ReviewRequest } from "../types.js";

export interface ReviewFixture {
  id: string;
  description: string;
  request: ReviewRequest;
  expectations: {
    shouldMentionAny?: string[];
    shouldAvoidAny?: string[];
    minFindings?: number;
    expectedSeverities?: string[];
  };
}

export const reviewFixtures: ReviewFixture[] = [
  {
    id: "plan-missing-branch",
    description: "Plan review should call out skipped branches and missing tests, not drift into generic advice.",
    request: {
      mode: "plan_review",
      title: "Single-path migration",
      content:
        "Plan: add a shared helper for activation, update the dashboard widget only, and skip tests because the change is small."
    },
    expectations: {
      shouldMentionAny: ["tests", "widget", "path", "branch", "skip"],
      shouldAvoidAny: ["add docs", "consider performance"],
      minFindings: 2,
      expectedSeverities: ["high"]
    }
  },
  {
    id: "code-duplication-risk",
    description: "Code review should focus on duplicated logic and rollout risk.",
    request: {
      mode: "code_review",
      title: "Two activation methods",
      files: [
        {
          path: "app/Widget.ts",
          content: "export function activateA(){ client.status='active'; syncWaitlist(); }"
        },
        {
          path: "app/Page.ts",
          content: "export function activateB(){ client.status='active'; }"
        }
      ]
    },
    expectations: {
      shouldMentionAny: ["waitlist", "duplicated", "activate", "Page.ts", "Widget.ts"],
      shouldAvoidAny: ["add docs"],
      minFindings: 1
    }
  },
  {
    id: "thin-text",
    description: "Thin input should stay tight rather than inventing a deep architecture review.",
    request: {
      mode: "text",
      title: "Tiny note",
      content: "Rename helper and update one file."
    },
    expectations: {
      shouldMentionAny: ["thin", "unclear", "missing evidence"],
      minFindings: 0
    }
  }
];
