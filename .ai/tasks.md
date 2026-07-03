# Open tasks

## Publish and validate the first npm release

Enable npm account 2FA, publish `@criminaly-vicious/ctx@0.1.0`, and verify the
first-run flow from the public registry in a clean Git repository.

### Acceptance criteria

- `npm view @criminaly-vicious/ctx version` returns `0.1.0`.
- `npx.cmd @criminaly-vicious/ctx --version` returns `0.1.0`.
- `npx.cmd @criminaly-vicious/ctx init` creates all four `.ai/` files.
- No network request occurs during `init` or `brief` without explicit opt-in.
- Claude, Cursor, and Codex briefs remain visibly different.
