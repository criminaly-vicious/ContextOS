---
name: ctx-brief
description: Pull routed project context from the ctx CLI before working in a repository that has ctx installed. Use at the start of coding work, when resuming an existing project, before making architecture or file-structure assumptions, or when the user references project decisions, conventions, prior work, or "the project" without re-explaining it. Detect ctx by the presence of a .ai directory at the repository root.
---

# ctx brief

Pull the agent-specific project brief before exploring a ctx-enabled repository broadly or changing code. Use it as the session's ground truth for architecture, recent decisions, conventions, open tasks, risks, and acceptance criteria.

## Workflow

1. Locate the repository root and check for a `.ai/` directory. If it is absent, skip this Skill silently and proceed normally.
2. Choose the brief target that matches the current agent:
   - Claude Code: `ctx brief claude`
   - Cursor: `ctx brief cursor`
   - Codex: `ctx brief codex`
   - Unknown agent: `ctx brief claude`
3. When the user supplied a concrete task, add `--task "short description"` so the output stays focused.
4. Run the command from the repository root and read its full stdout before broad file discovery or implementation.
5. Treat recorded project decisions and conventions as authoritative for the session. Still inspect every specific file before changing it.
6. If the user's request conflicts with a recorded decision, surface the conflict explicitly instead of silently overriding it.
7. If required context is missing, name the gap and ask rather than inventing architecture, conventions, or dependencies.

## Examples

```bash
ctx brief codex
ctx brief codex --task "add validation to the import command"
```

## Guardrails

- `ctx brief` is read-only against the repository.
- Never fabricate a brief. If the command fails or `ctx` is unavailable on `PATH`, state that plainly and continue without it.
- Do not send repository content anywhere. The CLI owns its local logging and opt-in telemetry behavior.
