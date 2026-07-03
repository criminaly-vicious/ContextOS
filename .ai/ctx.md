# Project context

## What we are building

`ctx` is a Git-only TypeScript CLI that prevents developers from re-explaining
project state to every coding agent. It combines explicit project context with
local Git history and routes visibly different briefs to Claude, Cursor, and
Codex.

## Recent architecture decisions

- Use Node.js 20+ and native APIs only at runtime to keep installation fast and
  the package disposable.
- Publish as `@criminaly-vicious/ctx` while keeping the executable named `ctx`;
  the unscoped npm name is owned by another maintainer.
- Keep shared intent in `.ai/ctx.md` and `.ai/tasks.md`; ignore the anonymous
  installation ID and append-only usage log.
- Make telemetry opt-in and restrict its payload by construction to
  `installationId`, `command`, and `timestamp`.
- Resolve the CLI entrypoint through real paths so npm-linked installations
  work across symbolic links.

## Code conventions

- Use strict TypeScript with NodeNext modules and cross-platform paths.
- Prefer native Node APIs over runtime dependencies.
- Cover behavior with the built-in `node:test` runner.
- Run `npm run lint` and `npm test` before committing.
- Use Git Flow branches and Conventional Commits without co-author trailers.
- Keep stdout plain, copyable, and pipeable; send diagnostics to stderr.

## Known risks

- The first npm release is blocked until account-level 2FA is enabled.
- PowerShell may block npm-generated `.ps1` launchers; `ctx.cmd` remains the
  compatible launcher without changing execution policy.
- Git and filename heuristics can identify relevant context but cannot infer
  undocumented architectural intent.
- The three agent briefs can drift toward similar output as features evolve;
  differentiation must remain covered by tests.
