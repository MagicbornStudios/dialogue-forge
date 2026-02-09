# Contributing

Human workflow for this repo. Agent workflow starts at `agents.md`.

## Branch and PR expectations

- Prefer one branch per slice.
- Keep PR scope small and reviewable.
- Use `.github/pull_request_template.md`.

## Validation expectations

Run before claiming completion (unless truly inapplicable):

- `pnpm run typecheck:domains`
- `pnpm run typecheck:studio`
- `pnpm run test`

For Payload collection changes, also run:

- `pnpm payload:generate`

If any check is skipped, note why in the PR.

## Documentation updates required

After each slice, update what changed:

- `docs/agent-artifacts/core/STATUS.md`
- `docs/agent-artifacts/core/errors-and-attempts.md` (if a non-obvious failure/fix happened)
- `docs/agent-artifacts/core/decisions.md` (for architectural decisions)
- `docs/agent-artifacts/core/MIGRATION.md` (for migration slices)
- Relevant AGENTS docs when rules/footguns change

## Finding work

- Start at `docs/00-docs-index.md`
- For migration work: `docs/plans/migration-forge-agent/00-index.md`
- For agent slices: `docs/18-agent-artifacts-index.md` and `docs/19-coding-agent-strategy.md`

## Guardrails

- Respect package boundaries from `agents.md`
- Keep docs markdown-first for this repo
- Avoid broad refactors without corresponding migration doc updates
