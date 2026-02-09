# Known Issues

Known product/editor issues and migration blockers.

Use this before assigning work or assuming a surface is stable.

## Current High-Risk Areas

### Writer persistence transition
- Writer still uses legacy page-level fields (`bookBody`, `content`) in active flows.
- Canonical target is Notion-shaped `pages + blocks` (see migration docs 63/65/66).
- Do not remove legacy fields until compatibility hooks and migration path are complete.

### Project loading at cold start
- First project query can be slow due to Payload init/seed path.
- Retry and lightweight query settings are in place, but cold-start timing remains environment-sensitive.

### Query client/module dedupe footguns
- Runtime may fail with `No QueryClient set` if React Query resolves to multiple module instances.
- Keep aliasing in `apps/studio/next.config.mjs` aligned.

### Yjs duplicate module warning risk
- Duplicate `yjs` / `y-websocket` / `y-protocols` resolution can cause constructor-check warnings.
- Keep Next aliases aligned to one module location.

## Migration Blockers / Constraints

1. `forge-agent` is canonical for collection/editor contract direction.
2. Dialogue-forge changes should be non-breaking during transition.
3. Legacy Writer fields are compatibility-only, not target-state design.

## Locked Non-Goals (Current Wave)

- No immediate removal of legacy Writer persistence fields from production paths.
- No full workspace->editor runtime conversion in this slice.
- No MDX migration requirement for this repo docs.

## Related Docs

- `docs/agent-artifacts/core/STATUS.md`
- `docs/agent-artifacts/core/errors-and-attempts.md`
- `docs/plans/migration-forge-agent/63-writer-pages-blocks-and-reorder.md`
- `docs/plans/migration-forge-agent/65-collection-alignment-matrix.md`
- `docs/plans/migration-forge-agent/66-workspace-to-editor-readiness.md`
