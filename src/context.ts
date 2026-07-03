import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export interface TelemetryConfig {
  enabled: boolean;
  endpoint: string | null;
}

export interface CtxConfig {
  installationId: string;
  telemetry: TelemetryConfig;
}

export interface TaskContext {
  objective: string;
  acceptanceCriteria: string[];
}

export interface ProjectContext {
  building: string;
  architecture: string;
  conventions: string;
  risks: string;
  task: TaskContext;
}

const CTX_TEMPLATE = `# Project context

## What we are building

Describe the product and the user problem it solves.

## Recent architecture decisions

Record decisions and the reasoning behind them.

## Code conventions

List the conventions an implementation agent must follow.

## Known risks

List current technical or product risks.
`;

const TASKS_TEMPLATE = `# Open tasks

## Next task

Describe the next concrete task.

### Acceptance criteria

- Add measurable completion criteria.
`;

const LOCAL_IGNORE_ENTRIES = [
  "# Local ctx installation data",
  ".ai/config.json",
  ".ai/usage.log",
];

function writeIfMissing(path: string, contents: string): boolean {
  if (existsSync(path)) {
    return false;
  }
  writeFileSync(path, contents, "utf8");
  return true;
}

function ensureLocalDataIgnored(root: string): void {
  const ignorePath = join(root, ".gitignore");
  const current = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  const missing = LOCAL_IGNORE_ENTRIES.filter(
    (entry) => !current.split(/\r?\n/).includes(entry),
  );

  if (missing.length === 0) {
    return;
  }

  const separator = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
  const leadingBlank = current.trim().length > 0 ? "\n" : "";
  appendFileSync(
    ignorePath,
    `${separator}${leadingBlank}${missing.join("\n")}\n`,
    "utf8",
  );
}

export function initializeProject(
  root: string,
  telemetryEnabled: boolean,
  telemetryEndpoint: string | null = process.env.CTX_TELEMETRY_ENDPOINT ?? null,
): { created: string[]; config: CtxConfig } {
  const aiDirectory = join(root, ".ai");
  mkdirSync(aiDirectory, { recursive: true });

  const created: string[] = [];
  if (writeIfMissing(join(aiDirectory, "ctx.md"), CTX_TEMPLATE)) {
    created.push(".ai/ctx.md");
  }
  if (writeIfMissing(join(aiDirectory, "tasks.md"), TASKS_TEMPLATE)) {
    created.push(".ai/tasks.md");
  }
  if (writeIfMissing(join(aiDirectory, "usage.log"), "")) {
    created.push(".ai/usage.log");
  }

  const configPath = join(aiDirectory, "config.json");
  let config: CtxConfig;
  if (existsSync(configPath)) {
    config = readConfig(root);
  } else {
    config = {
      installationId: randomUUID(),
      telemetry: {
        enabled: telemetryEnabled,
        endpoint: telemetryEndpoint,
      },
    };
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    created.push(".ai/config.json");
  }

  ensureLocalDataIgnored(root);
  return { created, config };
}

export function readConfig(root: string): CtxConfig {
  const configPath = join(root, ".ai", "config.json");
  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8")) as Partial<CtxConfig>;
    if (
      typeof parsed.installationId !== "string" ||
      typeof parsed.telemetry?.enabled !== "boolean"
    ) {
      throw new Error("missing required fields");
    }

    return {
      installationId: parsed.installationId,
      telemetry: {
        enabled: parsed.telemetry.enabled,
        endpoint:
          typeof parsed.telemetry.endpoint === "string"
            ? parsed.telemetry.endpoint
            : null,
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid .ai/config.json: ${detail}`);
  }
}

function normalizeHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function markdownSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.split(/\r?\n/);
  let heading: string | null = null;
  let body: string[] = [];

  const save = (): void => {
    if (heading) {
      sections.set(normalizeHeading(heading), body.join("\n").trim());
    }
  };

  for (const line of lines) {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (match?.[1]) {
      save();
      heading = match[1];
      body = [];
    } else if (heading) {
      body.push(line);
    }
  }
  save();
  return sections;
}

function section(
  sections: Map<string, string>,
  aliases: string[],
  fallback: string,
): string {
  for (const alias of aliases) {
    const value = sections.get(normalizeHeading(alias));
    if (value) {
      return value;
    }
  }
  return fallback;
}

function parseTaskBlock(tasksMarkdown: string, taskOverride?: string): TaskContext {
  const stopWords = new Set([
    "and",
    "for",
    "the",
    "with",
    "das",
    "dos",
    "para",
    "uma",
    "com",
  ]);
  const blocks = [
    ...tasksMarkdown.matchAll(
      /^##\s+(.+?)\s*$([\s\S]*?)(?=^##\s+|(?![\s\S]))/gm,
    ),
  ];
  const requested = taskOverride?.trim();
  const requestedTokens = normalizeHeading(requested ?? "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !stopWords.has(token));

  const scored = blocks.map((match) => {
    const title = match[1]?.trim() ?? "";
    const body = match[2]?.trim() ?? "";
    const searchable = normalizeHeading(`${title} ${body}`);
    const score = requestedTokens.reduce(
      (total, token) => total + (searchable.includes(token) ? 1 : 0),
      0,
    );
    return { title, body, score };
  });

  const bestMatch = [...scored].sort(
    (left, right) => right.score - left.score,
  )[0];
  const selected = requested
    ? bestMatch && bestMatch.score > 0
      ? bestMatch
      : null
    : (scored[0] ?? null);

  const tasksSearchable = normalizeHeading(tasksMarkdown);
  const flatTaskMatchesRequest =
    requestedTokens.length > 0 &&
    requestedTokens.some((token) => tasksSearchable.includes(token));
  const acceptanceSource =
    selected?.body ??
    (!requested || flatTaskMatchesRequest ? tasksMarkdown : "");
  const acceptanceMatch = acceptanceSource.match(
    /^###\s+(?:Acceptance criteria|Crit[eé]rios? de aceite)\s*$([\s\S]*?)(?=^###\s+|(?![\s\S]))/im,
  );
  const acceptanceCriteria =
    acceptanceMatch?.[1]
      ?.split(/\r?\n/)
      .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean) ?? [];

  const description =
    selected?.body
      .replace(
        /^###\s+(?:Acceptance criteria|Crit[eé]rios? de aceite)\s*$[\s\S]*$/im,
        "",
      )
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean)[0] ?? "";
  const uncheckedTask =
    tasksMarkdown.match(/^\s*[-*]\s+\[\s\]\s+(.+?)\s*$/im)?.[1]?.trim() ??
    "";

  const objective =
    requested ||
    [selected?.title, description].filter(Boolean).join(": ") ||
    uncheckedTask ||
    "No open task is documented.";

  return {
    objective,
    acceptanceCriteria:
      acceptanceCriteria.length > 0
        ? acceptanceCriteria
        : ["Document measurable acceptance criteria in .ai/tasks.md."],
  };
}

export function readProjectContext(
  root: string,
  taskOverride?: string,
): ProjectContext {
  const aiDirectory = join(root, ".ai");
  const contextPath = join(aiDirectory, "ctx.md");
  const tasksPath = join(aiDirectory, "tasks.md");

  if (!existsSync(contextPath) || !existsSync(tasksPath)) {
    throw new Error("ctx is not initialized here. Run `ctx init` first.");
  }

  const contextMarkdown = readFileSync(contextPath, "utf8");
  const tasksMarkdown = readFileSync(tasksPath, "utf8");
  const sections = markdownSections(contextMarkdown);

  return {
    building: section(
      sections,
      ["What we are building", "O que estamos construindo"],
      "Not documented in .ai/ctx.md.",
    ),
    architecture: section(
      sections,
      ["Recent architecture decisions", "Decisões de arquitetura recentes"],
      "Not documented in .ai/ctx.md.",
    ),
    conventions: section(
      sections,
      ["Code conventions", "Convenções de código"],
      "Not documented in .ai/ctx.md.",
    ),
    risks: section(
      sections,
      ["Known risks", "Riscos conhecidos"],
      "Not documented in .ai/ctx.md.",
    ),
    task: parseTaskBlock(tasksMarkdown, taskOverride),
  };
}
