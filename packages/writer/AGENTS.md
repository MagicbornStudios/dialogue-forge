# Writer Domain - AGENTS

## Purpose
- Narrative writing workspace and text editor flows.

## Owner Map
- Workspace shell: src/components/WriterWorkspace/WriterWorkspace.tsx
- Lexical editor plugins: src/components/WriterWorkspace/editor/

## Public API
- WriterWorkspace
- Narrative types

## Critical Invariants
- Writer may import Forge data hooks/types for narrative graph reads/writes, but must not import Forge UI/store internals or host app code.
- Lexical editor state sync uses workspace store actions.
- Use constants for any type discriminators.
- No draft slices or event bus in new work.

## Known Footguns
- Editor sync plugins must avoid infinite loops.
- Keep autosave debounced and explicit.
- Writer data access must use hooks in `src/data/writer-queries.ts`; do not reintroduce adapter contexts.
- Writer workspace and Lexical comment flows require `ForgePayloadProvider` in the host tree.
- Writer hooks also require the same React Query module instance as host `QueryClientProvider`; keep `@tanstack/react-query` aliased in `apps/studio/next.config.mjs` (webpack + Turbopack) to avoid context split.
- Studio's writer top-bar project dropdown uses host project queries with SDK+REST fallback; when projects fail to load, use the surfaced error text (not just the generic label) to debug `/api/projects`.
- Keep project list reads lightweight (`depth=0`); relationship expansion on `projects` can inflate payloads and cause startup-time fetch failures before the first writer render.
- Keep the writer project dropdown wired to `ProjectSwitcher` `onRetry` so users can recover from cold-start project query failures without a full page reload.
- For Notion SDK page/block migration and reorder work, treat `docs/plans/migration-forge-agent/63-writer-pages-blocks-and-reorder.md` as the execution order and "what's next" source of truth.
- During compatibility migration, read editor content through `useWriterResolvedPageContent(pageId)` (prefers canonical `blocks`, falls back to legacy `bookBody`) to avoid split-brain reads.
- Block writes/reorders should go through block hooks (`useCreateWriterBlock`, `useUpdateWriterBlock`, `useDeleteWriterBlock`, `useReorderWriterBlocks`) and not mutate page-level `order`/`bookBody` as the primary source.

## How to Test
- npm run build
- npm run test

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] editor state sync verified
  - [ ] tests pass
- Constraints:
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
