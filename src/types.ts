export type ReviewMode =
  | "plan"
  | "diff"
  | "file"
  | "text"
  | "plan_review"
  | "code_review"
  | "strict_review";

export interface ReviewFileInput {
  path: string;
  content: string;
}

export interface ReviewContext {
  repo?: string;
  review_style?: string;
  branch?: string;
  commit?: string;
  extra_instructions?: string;
}

export interface ReviewRequest {
  mode: ReviewMode;
  title?: string;
  content?: string;
  diff?: string;
  files?: ReviewFileInput[];
  context?: ReviewContext;
}

export type ReviewSeverity = "critical" | "high" | "medium" | "low";

export interface ReviewFinding {
  severity: ReviewSeverity;
  title: string;
  body: string;
  references: string[];
}

export interface ReviewResponse {
  summary: string;
  findings: ReviewFinding[];
  open_questions: string[];
  change_summary: string;
}

export interface ReviewLogEvent {
  timestamp: string;
  method: string;
  path: string;
  mode?: string;
  statusCode: number;
  durationMs: number;
  outcome: "ok" | "client_error" | "server_error";
}
