#!/usr/bin/env node

import { existsSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { renderBrief, type Agent } from "./briefs.js";
import { findRepositoryRoot } from "./git.js";
import { initializeProject } from "./context.js";
import { recordUsage } from "./usage.js";

const VERSION = "0.1.0";
const AGENTS = new Set<Agent>(["claude", "cursor", "codex"]);

function help(): string {
  return `ctx ${VERSION}

Generate agent-specific context briefs from a local Git repository.

Usage:
  ctx init
  ctx brief <claude|cursor|codex> [--task "description"]

Options:
  --task <description>  Scope a brief to one concrete task
  -h, --help            Show help
  -v, --version         Show version
`;
}

async function askTelemetry(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    process.stderr.write(
      "Telemetry disabled because ctx init is running non-interactively.\n",
    );
    return false;
  }

  process.stdout.write(
    "\nAnonymous usage telemetry sends only installation id, command, and timestamp.\n" +
      "Repository content is never sent. You can disable it in .ai/config.json.\n",
  );
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await terminal.question("Enable anonymous telemetry? [y/N] ");
  terminal.close();
  return /^(y|yes)$/i.test(answer.trim());
}

async function runInit(cwd: string): Promise<void> {
  const root = findRepositoryRoot(cwd);
  const configExists = existsSync(join(root, ".ai", "config.json"));
  const telemetryEnabled = configExists ? false : await askTelemetry();
  const { created, config } = initializeProject(root, telemetryEnabled);
  await recordUsage(root, "init");

  const result =
    created.length > 0
      ? `Created ${created.join(", ")}.`
      : "ctx was already initialized; existing files were preserved.";
  process.stdout.write(
    `${result}\n` +
      `Telemetry: ${config.telemetry.enabled ? "enabled" : "disabled"}.\n` +
      "Fill in .ai/ctx.md and .ai/tasks.md, then run `ctx brief codex`.\n",
  );
}

async function runBrief(
  cwd: string,
  agentValue: string | undefined,
  task: string | undefined,
): Promise<void> {
  if (!agentValue || !AGENTS.has(agentValue as Agent)) {
    throw new Error("Choose a brief target: claude, cursor, or codex.");
  }

  const agent = agentValue as Agent;
  const root = findRepositoryRoot(cwd);
  const output = renderBrief(agent, root, task);
  process.stdout.write(output);
  await recordUsage(root, `brief ${agent}`);
}

export async function main(
  argv = process.argv.slice(2),
  cwd = process.cwd(),
): Promise<void> {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      task: { type: "string" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (parsed.values.help) {
    process.stdout.write(help());
    return;
  }
  if (parsed.values.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  const [command, target, ...extra] = parsed.positionals;
  if (extra.length > 0) {
    throw new Error(`Unexpected argument: ${extra[0]}`);
  }

  switch (command) {
    case "init":
      if (target) {
        throw new Error(`Unexpected argument: ${target}`);
      }
      if (parsed.values.task) {
        throw new Error("--task is only valid with `ctx brief`.");
      }
      await runInit(cwd);
      return;
    case "brief":
      await runBrief(cwd, target, parsed.values.task);
      return;
    default:
      process.stdout.write(help());
      if (command) {
        throw new Error(`Unknown command: ${command}`);
      }
  }
}

export function isMainModule(
  executablePath: string | undefined,
  moduleUrl: string,
): boolean {
  if (!executablePath) {
    return false;
  }

  try {
    return (
      realpathSync(executablePath) === realpathSync(fileURLToPath(moduleUrl))
    );
  } catch {
    return false;
  }
}

if (isMainModule(process.argv[1], import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`ctx: ${message}\n`);
    process.exitCode = 1;
  });
}
