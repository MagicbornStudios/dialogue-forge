# AGENTS (Repo Guide)

## Start Here (Required)

1. Read `docs/agent-artifacts/core/STATUS.md` first (or `docs/STATUS.md`).
2. Read `docs/architecture/workspace-editor-architecture.md`.
3. Read `SKILLS.md` and `ISSUES.md`.
4. Read domain AGENTS docs before touching code:
- `packages/shared/AGENTS.md`
- `packages/forge/AGENTS.md`
- `packages/writer/AGENTS.md`
- `packages/video/AGENTS.md` (if present)
- `packages/characters/AGENTS.md`
- `packages/theme/AGENTS.md`
- `packages/ai/AGENTS.md`

After changes, update `STATUS` + relevant AGENTS docs.

## Consumer + Playground Alignment (forge-agent)

- Treat `../forge-agent` as source-of-truth for editor platform contracts and migration direction.
- This repo validates ideas first, then upstreams stable patterns to forge-agent.
- Use `docs/plans/migration-forge-agent/` for parity and migration sequencing.

## Migration Loop

When doing migration slices:

1. Read `docs/plans/migration-forge-agent/00-index.md` and the target plan.
2. Execute one small slice.
3. Update plan Done/Next.
4. Update `docs/agent-artifacts/core/MIGRATION.md`.

Do not reintroduce out-of-scope features from `11-out-of-scope.md`.

## Boundaries (Non-Negotiable)

- `packages/**` must not import from `apps/studio/**`.
- `packages/shared` has no internal package dependencies.
- No cross-domain imports between forge/writer/video/characters/theme.
- `packages/ai` imports shared only.
- No `@/` alias in package code.

## Build + Test

- `pnpm run build`
- `pnpm run typecheck:domains`
- `pnpm run typecheck:studio`
- `pnpm run test`

## Repo Hygiene

- Generated declarations belong in build output only.
- Keep build artifacts out of git (`**/dist`, `.turbo`, `**/.next`).

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] <measurable criteria>
  - [ ] validation ran
- Constraints:
  - respect boundaries
  - constants for discriminators
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat until green
5. Output: <promise>COMPLETE</promise>
