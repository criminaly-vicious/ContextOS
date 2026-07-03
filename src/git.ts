import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Commit {
  hash: string;
  date: string;
  subject: string;
  files: string[];
}

function runGit(cwd: string, args: string[], allowFailure = false): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(`Unable to run Git: ${result.error.message}`);
  }

  if (result.status !== 0) {
    if (allowFailure) {
      return "";
    }

    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(detail || `Git exited with status ${result.status}.`);
  }

  return result.stdout.trimEnd();
}

export function findRepositoryRoot(cwd: string): string {
  const root = runGit(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) {
    throw new Error("Run ctx inside a Git repository.");
  }
  return root;
}

export function getRecentCommits(root: string, limit = 12): Commit[] {
  const output = runGit(
    root,
    [
      "log",
      `-n${limit}`,
      "--date=short",
      "--pretty=format:%x1e%h%x1f%ad%x1f%s",
      "--name-only",
    ],
    true,
  );

  if (!output) {
    return [];
  }

  return output
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [header = "", ...fileLines] = record.split(/\r?\n/);
      const [hash = "", date = "", subject = ""] = header.split("\x1f");
      return {
        hash,
        date,
        subject,
        files: fileLines.map((line) => line.trim()).filter(Boolean),
      };
    });
}

export function getWorkingFiles(root: string): string[] {
  const output = runGit(
    root,
    ["status", "--short", "--untracked-files=all"],
    true,
  );
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

export function getRecentlyChangedFiles(root: string, limit = 5): string[] {
  const output = runGit(
    root,
    ["log", `-n${limit}`, "--name-only", "--pretty=format:"],
    true,
  );
  if (!output) {
    return [];
  }

  return [...new Set(output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
}

function taskTokens(task: string): string[] {
  return task
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

export function getRelevantTests(root: string, task: string): string[] {
  const output = runGit(
    root,
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    true,
  );
  const testPattern =
    /(^|\/)(?:__tests__|test|tests|spec)(?:\/|$)|\.(?:test|spec)\.[^/]+$/i;
  const tokens = taskTokens(task);

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter((file) => testPattern.test(file))
    .map((file) => ({
      file,
      score: tokens.reduce(
        (total, token) => total + (file.toLowerCase().includes(token) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file))
    .slice(0, 12)
    .map(({ file }) => file);
}

export function getValidationCommands(root: string): string[] {
  const packagePath = join(root, "package.json");
  let packageJson: { scripts?: Record<string, string> };

  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
      scripts?: Record<string, string>;
    };
  } catch {
    return [];
  }

  const scripts = packageJson.scripts ?? {};
  const preferredOrder = ["lint", "typecheck", "check", "test", "build"];
  const runner = existsSync(join(root, "pnpm-lock.yaml"))
    ? "pnpm"
    : existsSync(join(root, "yarn.lock"))
      ? "yarn"
      : existsSync(join(root, "bun.lock")) ||
          existsSync(join(root, "bun.lockb"))
        ? "bun"
        : "npm";

  return preferredOrder
    .filter((name) => typeof scripts[name] === "string")
    .map((name) => {
      if (runner === "npm") {
        return name === "test" ? "npm test" : `npm run ${name}`;
      }
      if (runner === "bun") {
        return `bun run ${name}`;
      }
      return `${runner} ${name}`;
    });
}
