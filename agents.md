# AGENTS (Repo Guide)

## Start Here (Required)
1. Read `docs/agent-artifacts/core/STATUS.md` first (or `docs/STATUS.md` which redirects there).
2. Read `docs/architecture/workspace-editor-architecture.md`.
3. Read the domain AGENTS file before touching code:
   - `packages/shared/AGENTS.md`
   - `packages/forge/AGENTS.md`
   - `packages/writer/AGENTS.md`
   - `packages/video/AGENTS.md` (if present)
   - `packages/characters/AGENTS.md`
   - `packages/theme/AGENTS.md`
   - `packages/ai/AGENTS.md`

After changes, update STATUS + the relevant domain AGENTS with new footguns or rules.

## Consumer + Playground Alignment (forge-agent)

- Treat `../forge-agent` as the publisher/source-of-truth for `@forge/dev-kit`, local registry, vendor workflows, and Copilot/runtime wiring.
- This repo is the consumer + experimental playground. Validate ideas here first, then upstream stable patterns to `forge-agent`.
- Read `docs/guides/README.md` for numbered, fast context aligned with forge-agent docs.

## Migration to forge-agent

When working on migration to forge-agent: read [docs/plans/migration-forge-agent/00-index.md](docs/plans/migration-forge-agent/00-index.md) and the relevant plan (30�33). Do not migrate edge-drop (see [docs/plans/migration-forge-agent/11-out-of-scope.md](docs/plans/migration-forge-agent/11-out-of-scope.md)). After each slice, update the plan and [docs/agent-artifacts/core/MIGRATION.md](docs/agent-artifacts/core/MIGRATION.md).

## Repo Structure (Current)
- `apps/studio/` = Next.js studio app + PayloadCMS integration + API routes.
- `packages/shared/` = shared types, UI, utilities (no internal deps).
- `packages/forge/` = Forge editor domain.
- `packages/writer/` = Writer domain.
- `packages/characters/` = Characters domain.
- `packages/theme/` = Theme workspace domain.
- `packages/ai/` = AI infra + CopilotKit provider.
- `packages/dialogue-forge/` = umbrella re-export package.

## Boundaries (Non-Negotiable)
- `packages/**` must never import from `apps/studio/**`.
- `packages/shared` has no internal deps.
- Domain packages depend on `packages/shared`.
- No cross-domain imports between forge/writer/video/characters/theme.
- AI package imports shared only (no domain imports).
- No `@/` alias in package code; use `@magicborn/<domain>/*` or relative paths.

## Build + Test (Workspace)
- `pnpm run build`
- `pnpm run typecheck:domains`
- `pnpm run typecheck:studio`
- `pnpm run test`

## Repo Hygiene
- Generated declarations live in `dist` only; remove any `packages/**/src/**/*.d.ts`.
- Keep build artifacts out of git (`**/dist`, `.turbo`, `**/.next`).

## Prompt Templates (Use These)

Task:
- Goal: <one sentence>
- Completion:
  - [ ] <measurable criteria>
  - [ ] tests pass
- Constraints:
  - respect boundaries
  - no string literals for type discriminators
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat until green
5. Output: <promise>COMPLETE</promise>
