import type { ReviewLogEvent } from "./types.js";

let loggingEnabled = true;

export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}

export function logEvent(event: ReviewLogEvent): void {
  if (!loggingEnabled) {
    return;
  }
  console.log(JSON.stringify(event));
}
