import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runGit(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024
  });
  return stdout;
}

export async function getGitDiff(range?: string, cwd?: string): Promise<string> {
  const args = range ? ["diff", range] : ["diff"];
  return runGit(args, cwd);
}

export async function getStagedDiff(cwd?: string): Promise<string> {
  return runGit(["diff", "--staged"], cwd);
}

export async function getFileContent(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}
