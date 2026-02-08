# AGENTS (Repo Guide)

## Start Here (Required)
1. Read `docs/agent-artifacts/core/STATUS.md` first (or `docs/STATUS.md` which redirects there).
2. Read `docs/architecture/workspace-editor-architecture.md`.
3. Read the domain AGENTS file before touching code:
   - `packages/shared/AGENTS.md`
   - `packages/forge/AGENTS.md`
   - `packages/writer/AGENTS.md`
   - `packages/video/AGENTS.md`
   - `packages/characters/AGENTS.md`
   - `packages/ai/AGENTS.md`

After changes, update STATUS + the relevant domain AGENTS with new footguns or rules.

## Consumer + Playground Alignment (forge-agent)

- Treat `../forge-agent` as the publisher/source-of-truth for `@forge/dev-kit`, local registry, vendor workflows, and Copilot/runtime wiring.
- In this repo, prioritize consumer validation and experimental slices that can be upstreamed back to `forge-agent`.
- Read `docs/guides/README.md` for numbered, fast context aligned to forge-agent style.

## Migration to forge-agent

When working on migration to forge-agent: read [docs/plans/migration-forge-agent/00-index.md](docs/plans/migration-forge-agent/00-index.md) and the relevant plan (30–33). Do not migrate edge-drop (see [docs/plans/migration-forge-agent/11-out-of-scope.md](docs/plans/migration-forge-agent/11-out-of-scope.md)). After each slice, update the plan and [docs/agent-artifacts/core/MIGRATION.md](docs/agent-artifacts/core/MIGRATION.md).

## Repo Structure (Current)
- `apps/host/` = Next.js host app + adapters (PayloadCMS, routes, API).
- `packages/shared/` = shared types, UI, utilities (no internal deps).
- `packages/forge/` = Forge editor domain.
- `packages/writer/` = Writer domain.
- `packages/video/` = Video domain (Twick wrapper).
- `packages/characters/` = Characters domain.
- `packages/ai/` = AI infra + CopilotKit provider.
- `packages/dialogue-forge/` = umbrella re-export package.

## Boundaries (Non-Negotiable)
- `packages/**` must never import from `apps/host/**`.
- `packages/shared` has no internal deps.
- Domain packages depend on `packages/shared` (AI allowed only for CopilotKit wiring).
- No cross-domain imports between forge/writer/video/characters.
- AI package imports shared only (no domain imports).
- No `@/` alias in code; use `@magicborn/<domain>/*` or relative paths.

## Build + Test (Workspace)
- `pnpm run build`
- `pnpm run typecheck:domains`
- `pnpm run typecheck:host`
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
