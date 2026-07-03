import {
  getRecentlyChangedFiles,
  getRecentCommits,
  getRelevantTests,
  getValidationCommands,
  getWorkingFiles,
  type Commit,
} from "./git.js";
import { readProjectContext, type ProjectContext } from "./context.js";

export type Agent = "claude" | "cursor" | "codex";

function list(items: string[], emptyMessage: string): string {
  if (items.length === 0) {
    return `- ${emptyMessage}`;
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function commitLine(commit: Commit, includeFiles = false): string {
  const files =
    includeFiles && commit.files.length > 0
      ? ` — ${commit.files.slice(0, 4).join(", ")}`
      : "";
  return `${commit.hash} (${commit.date}) ${commit.subject}${files}`;
}

function structuralCommits(commits: Commit[]): Commit[] {
  const structural =
    /arch|decision|refactor|structure|config|depend|build|scaffold|infra/i;
  const structuralFile =
    /(^|\/)(package\.json|tsconfig.*|[^/]*config[^/]*|src\/(?:core|domain|app))/i;

  return commits
    .filter(
      (commit) =>
        structural.test(commit.subject) ||
        commit.files.some((file) => structuralFile.test(file)),
    )
    .slice(0, 6);
}

function scopeLine(taskOverride: string | undefined): string {
  return taskOverride?.trim()
    ? `Task scope: ${taskOverride.trim()}`
    : "Task scope: current task from .ai/tasks.md";
}

function renderClaude(
  context: ProjectContext,
  commits: Commit[],
  taskOverride?: string,
): string {
  const decisions = structuralCommits(commits).map((commit) =>
    commitLine(commit, true),
  );

  return `# ctx brief: Claude

${scopeLine(taskOverride)}

## What we are building

${context.building}

## Architecture and recent decisions

${context.architecture}

## Current objective

${context.task.objective}

## Known risks

${context.risks}

## Structural changes from Git

${list(decisions, "No structural commits detected in recent history.")}
`;
}

function renderCursor(
  context: ProjectContext,
  commits: Commit[],
  root: string,
  taskOverride?: string,
): string {
  const workingFiles = getWorkingFiles(root);
  const recentFiles = getRecentlyChangedFiles(root);
  const implementationCommits = commits
    .slice(0, 5)
    .map((commit) => commitLine(commit, true));

  return `# ctx brief: Cursor

${scopeLine(taskOverride)}

## Where to work now

${list(
  workingFiles.length > 0 ? workingFiles : recentFiles,
  "No working-tree or recently changed files detected.",
)}

## Local code conventions

${context.conventions}

## Immediate TODO

${context.task.objective}

## Recent implementation changes

${list(implementationCommits, "No commits detected in this repository.")}
`;
}

function renderCodex(
  context: ProjectContext,
  root: string,
  taskOverride?: string,
): string {
  const tests = getRelevantTests(root, context.task.objective);
  const validationCommands = getValidationCommands(root);

  return `# ctx brief: Codex

${scopeLine(taskOverride)}

## Closed-scope task

${context.task.objective}

## Acceptance criteria

${list(context.task.acceptanceCriteria, "No acceptance criteria documented.")}

## Relevant existing tests

${list(tests, "No test files detected.")}

## Validation commands

${list(
  validationCommands.map((command) => `\`${command}\``),
  "No validation scripts detected in package.json.",
)}

## Done when

Complete the task, satisfy every acceptance criterion, and run every validation command above.
`;
}

export function renderBrief(
  agent: Agent,
  root: string,
  taskOverride?: string,
): string {
  const context = readProjectContext(root, taskOverride);
  const commits = getRecentCommits(root);

  switch (agent) {
    case "claude":
      return renderClaude(context, commits, taskOverride);
    case "cursor":
      return renderCursor(context, commits, root, taskOverride);
    case "codex":
      return renderCodex(context, root, taskOverride);
  }
}
