# ctx

`ctx` turns local Git history plus a small, human-written project context into
different briefs for Claude, Cursor, and Codex. It works offline and sends no
repository content anywhere.

## Quick start

```bash
npx @criminaly-vicious/ctx init
```

Fill in `.ai/ctx.md` and `.ai/tasks.md`, then generate a brief:

```bash
npm install --global @criminaly-vicious/ctx
ctx brief claude
ctx brief cursor
ctx brief codex
ctx brief codex --task "add input validation"
```

Each target receives a different slice:

- Claude: product intent, architecture decisions, risks, and structural commits.
- Cursor: changed files, local conventions, immediate TODO, and recent implementation commits.
- Codex: a closed-scope task, acceptance criteria, relevant tests, and validation commands.

All brief output is plain text written to stdout, so it can be copied or piped.

## Files created by `ctx init`

```text
.ai/
  ctx.md
  tasks.md
  config.json
  usage.log
```

Commit `ctx.md` and `tasks.md` when the team should share them. The generated
installation ID and local usage history are added to `.gitignore`.

## Anonymous usage telemetry

`ctx init` asks once before enabling telemetry. The only event fields are:

```json
{
  "installationId": "anonymous UUID",
  "command": "brief codex",
  "timestamp": "ISO-8601 timestamp"
}
```

No network request occurs unless `.ai/config.json` has `telemetry.enabled` set
to `true` and a valid endpoint. Set the endpoint with
`CTX_TELEMETRY_ENDPOINT` during `ctx init`, or edit `telemetry.endpoint` in the
config. Set `telemetry.enabled` to `false` at any time to disable transmission.
Local usage logging remains append-only.

## Development

```bash
npm install
npm run lint
npm test
npm pack
```
