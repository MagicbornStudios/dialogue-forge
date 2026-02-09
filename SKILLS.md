# SKILLS

Capabilities contract for contributors and coding agents.

For behavior rules and workflow, see `agents.md` and `CONTRIBUTING.md`.

If guidance conflicts: follow `SKILLS.md` unless `agents.md` explicitly overrides it.

## You Can Assume

### Stack and architecture
- TypeScript + React + Next.js (App Router)
- Payload CMS backend in `apps/studio/payload`
- pnpm monorepo (`apps/*`, `packages/*`)
- Zustand for local/draft state and TanStack Query for server state
- Domain packages: `@magicborn/{forge,writer,characters,theme,shared,ai}`

### Workspace/editor model
- This repo is the consumer/playground aligned to `../forge-agent`
- Workspaces are expected to migrate toward editor-style contracts in forge-agent
- Migration docs live in `docs/plans/migration-forge-agent/`

### Data and API boundary
- Domain packages must not import from `apps/studio/**`
- Browser data access should go through package hooks or host client modules, not ad-hoc route fetches inside package UI
- Payload collection changes require regenerated types

### Testing and validation expectations
- Run relevant checks before marking work complete:
- `pnpm run typecheck:domains`
- `pnpm run typecheck:studio`
- Additional validation for schema changes: `pnpm payload:generate`
- `pnpm run test` is required when feasible; if skipped, state why

## You Must Not Assume

- That legacy adapter-context patterns are acceptable for new data access work
- That `bookBody` / `content` are the long-term Writer contracts (they are compatibility-era fields)
- That migration plans in this repo imply direct implementation in forge-agent unless explicitly stated
- That files under ignored/generated/vendor temp paths are safe to edit

## Work Completion Expectations

After each slice:
1. Update `docs/agent-artifacts/core/STATUS.md`
2. Update relevant AGENTS docs if rules/footguns changed
3. Record costly failures in `docs/agent-artifacts/core/errors-and-attempts.md`
4. For migration slices, update `docs/agent-artifacts/core/MIGRATION.md`

## Navigation Expectations

- Prefer `rg` for search and focused file reads
- Start from `docs/00-docs-index.md`
- For agent operations: `docs/18-agent-artifacts-index.md` then `docs/19-coding-agent-strategy.md`

## References

- `agents.md`
- `CONTRIBUTING.md`
- `docs/00-docs-index.md`
- `docs/18-agent-artifacts-index.md`
- `docs/19-coding-agent-strategy.md`
