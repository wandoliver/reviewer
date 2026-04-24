import type { ReviewLogEvent } from "./types.js";

export function logEvent(event: ReviewLogEvent): void {
  console.log(JSON.stringify(event));
}
