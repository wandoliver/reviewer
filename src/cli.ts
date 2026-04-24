import process from "node:process";
import { getFileContent, getGitDiff, getStagedDiff } from "./git.js";
import { review } from "./reviewer.js";
import type { ReviewMode, ReviewRequest } from "./types.js";

function usage(): never {
  console.error(`Usage:
  npm run cli -- file <path> [mode]
  npm run cli -- text <path> [mode]
  npm run cli -- diff [git-range] [mode]
  npm run cli -- staged [mode]

Modes:
  plan | diff | file | text | plan_review | code_review | strict_review`);
  process.exit(1);
}

function parseMode(value: string | undefined, fallback: ReviewMode): ReviewMode {
  const allowed: ReviewMode[] = ["plan", "diff", "file", "text", "plan_review", "code_review", "strict_review"];
  return value && allowed.includes(value as ReviewMode) ? (value as ReviewMode) : fallback;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command) {
    usage();
  }

  let request: ReviewRequest;

  if (command === "file") {
    const inputPath = args[1];
    if (!inputPath) usage();
    const mode = parseMode(args[2], "code_review");
    request = {
      mode,
      title: inputPath,
      files: [{ path: inputPath, content: await getFileContent(inputPath) }]
    };
  } else if (command === "text") {
    const inputPath = args[1];
    if (!inputPath) usage();
    const mode = parseMode(args[2], "text");
    request = {
      mode,
      title: inputPath,
      content: await getFileContent(inputPath)
    };
  } else if (command === "diff") {
    const range = args[1] && !args[1].includes("_review") && !["plan", "diff", "file", "text", "code_review", "strict_review"].includes(args[1]) ? args[1] : undefined;
    const modeArg = range ? args[2] : args[1];
    const mode = parseMode(modeArg, "code_review");
    request = {
      mode,
      title: range ? `git diff ${range}` : "git diff",
      diff: await getGitDiff(range)
    };
  } else if (command === "staged") {
    const mode = parseMode(args[1], "code_review");
    request = {
      mode,
      title: "git diff --staged",
      diff: await getStagedDiff()
    };
  } else {
    usage();
  }

  const result = await review(request);

  console.log(JSON.stringify(result, null, 2));
}

void main();
