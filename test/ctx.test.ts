import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { renderBrief } from "../src/briefs.js";
import { initializeProject } from "../src/context.js";
import { recordUsage, type UsageEvent } from "../src/usage.js";

const roots: string[] = [];

function temporaryRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "ctx-test-"));
  roots.push(root);
  const result = spawnSync("git", ["init"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
  return root;
}

function git(root: string, ...args: string[]): void {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
}

after(() => {
  // Temporary OS directories are intentionally left for automatic cleanup so
  // tests never perform recursive deletion on a computed path.
  assert.ok(roots.every((root) => root.startsWith(tmpdir())));
});

test("init scaffolds ctx files, preserves existing context, and ignores local data", () => {
  const root = temporaryRepository();
  const first = initializeProject(root, false);
  const contextPath = join(root, ".ai", "ctx.md");
  writeFileSync(contextPath, "# custom context\n", "utf8");
  const second = initializeProject(root, true, "https://example.test/events");

  assert.deepEqual(first.created.sort(), [
    ".ai/config.json",
    ".ai/ctx.md",
    ".ai/tasks.md",
    ".ai/usage.log",
  ]);
  assert.deepEqual(second.created, []);
  assert.equal(readFileSync(contextPath, "utf8"), "# custom context\n");
  assert.equal(second.config.telemetry.enabled, false);

  const ignore = readFileSync(join(root, ".gitignore"), "utf8");
  assert.match(ignore, /^\.ai\/config\.json$/m);
  assert.match(ignore, /^\.ai\/usage\.log$/m);
});

test("Claude, Cursor, and Codex briefs contain different agent-specific slices", () => {
  const root = temporaryRepository();
  initializeProject(root, false);
  writeFileSync(
    join(root, ".ai", "ctx.md"),
    `# Project context

## What we are building

A local Git context CLI.

## Recent architecture decisions

Use native Node APIs and stdout-only briefs.

## Code conventions

Use strict TypeScript and small modules.

## Known risks

Agent outputs becoming indistinguishable.
`,
    "utf8",
  );
  writeFileSync(
    join(root, ".ai", "tasks.md"),
    `# Open tasks

## Add brief routing

Render a different brief for each supported agent.

### Acceptance criteria

- Claude receives architecture decisions.
- Cursor receives changed files.
- Codex receives tests and validation commands.
`,
    "utf8",
  );
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      scripts: {
        lint: "tsc --noEmit",
        test: "node --test",
      },
    }),
    "utf8",
  );
  writeFileSync(join(root, "briefs.test.ts"), "export {};\n", "utf8");
  writeFileSync(join(root, "briefs.ts"), "export const brief = true;\n", "utf8");
  git(root, "add", ".");
  git(
    root,
    "-c",
    "user.name=ctx tests",
    "-c",
    "user.email=ctx@example.test",
    "commit",
    "-m",
    "feat: add brief architecture",
  );
  writeFileSync(join(root, "briefs.ts"), "export const brief = false;\n", "utf8");

  const claude = renderBrief("claude", root);
  const cursor = renderBrief("cursor", root);
  const codex = renderBrief("codex", root);

  assert.notEqual(claude, cursor);
  assert.notEqual(cursor, codex);
  assert.notEqual(claude, codex);
  assert.match(claude, /Use native Node APIs/);
  assert.match(claude, /Known risks/);
  assert.match(cursor, /briefs\.ts/);
  assert.match(cursor, /Use strict TypeScript/);
  assert.match(codex, /briefs\.test\.ts/);
  assert.match(codex, /`npm run lint`/);
  assert.match(codex, /`npm test`/);
});

test("Codex detects untracked tests and uses the repository package manager", () => {
  const root = temporaryRepository();
  initializeProject(root, false);
  writeFileSync(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      scripts: {
        lint: "tsc --noEmit",
        test: "node --test",
      },
    }),
    "utf8",
  );
  writeFileSync(join(root, "routing.test.ts"), "export {};\n", "utf8");

  const codex = renderBrief("codex", root, "implement routing");

  assert.match(codex, /routing\.test\.ts/);
  assert.match(codex, /`pnpm lint`/);
  assert.match(codex, /`pnpm test`/);
});

test("free-form unchecked tasks and Portuguese acceptance headings are parsed", () => {
  const root = temporaryRepository();
  initializeProject(root, false);
  writeFileSync(
    join(root, ".ai", "tasks.md"),
    `# Tarefas abertas

- [ ] Corrigir roteamento dos briefs

### Critérios de aceite

- Cada agente recebe uma saída diferente.
`,
    "utf8",
  );

  const codex = renderBrief("codex", root);

  assert.match(codex, /Corrigir roteamento dos briefs/);
  assert.match(codex, /Cada agente recebe uma saída diferente/);
});

test("an unrelated task override does not inherit stale acceptance criteria", () => {
  const root = temporaryRepository();
  initializeProject(root, false);

  const codex = renderBrief("codex", root, "publish the package");

  assert.doesNotMatch(codex, /Add measurable completion criteria/);
  assert.match(codex, /Document measurable acceptance criteria/);
});

test("disabled telemetry writes locally without making a network call", async () => {
  const root = temporaryRepository();
  initializeProject(root, false, "https://example.test/events");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("fetch must not be called");
  };

  try {
    const event = await recordUsage(
      root,
      "brief codex",
      new Date("2026-07-03T12:00:00.000Z"),
    );
    assert.deepEqual(JSON.parse(readFileSync(join(root, ".ai", "usage.log"), "utf8")), event);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("opted-in telemetry sends only installation id, command, and timestamp", async () => {
  let received: UsageEvent | undefined;
  const server = createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      received = JSON.parse(body) as UsageEvent;
      response.writeHead(204);
      response.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const root = temporaryRepository();
  initializeProject(root, true, `http://127.0.0.1:${address.port}/events`);
  const expected = await recordUsage(
    root,
    "brief claude",
    new Date("2026-07-03T13:00:00.000Z"),
  );

  assert.deepEqual(received, expected);
  assert.deepEqual(Object.keys(received ?? {}).sort(), [
    "command",
    "installationId",
    "timestamp",
  ]);
  assert.doesNotMatch(JSON.stringify(received), /repository|context|source/i);

  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
