# Forge Domain - AGENTS

## Purpose
- Visual graph editor for dialogue trees and narrative graphs.

## Owner Map
- Forge workspace shell: src/components/ForgeWorkspace/ForgeWorkspace.tsx
- Graph editors: src/components/ForgeWorkspace/components/GraphEditors/
- Game player runtime + composition adapter: src/lib/game-player/
- Runtime/composition contracts: packages/shared/src/types/runtime.ts + packages/shared/src/types/composition.ts

## Public API
- DialogueGraphEditor
- ForgeWorkspace
- Yarn import/export helpers
- GamePlayer + composition utilities (graph runner, variable storage, graph-to-composition)

## Folder Map
- src/components: UI
- src/lib: graph helpers + utilities
- src/types: forge-specific type re-exports

## Critical Invariants
- Use NODE_TYPE/FLAG_TYPE/VIEW_MODE constants.
- Forge must not import Writer or host types.
- Forge may import Video types/renderers for playback only; avoid new cross-domain links.
- useGraphAutoSave + useSimpleForgeFlowEditor for save paths.
- No draft slices or event bus in new work.
- Data access must use Forge package hooks from `src/data/forge-queries.ts`; do not reintroduce adapter contexts.

## Do / Don't
- Do keep changes localized and reviewable.
- Do prefer shared utils for reused logic.
- Don't introduce string literals for type checks.

## Known Footguns
- Graph deletion must call `useDeleteForgeGraph().mutateAsync(id)` and then `actions.removeGraph(id)` for immediate UI consistency.
- Forge workspace content area (menu bar + layout): the layout must be wrapped in a container with `flex-1 min-h-0` (and optionally `overflow-hidden`) so it gets bounded height; otherwise the bottom (storylet) panel is cut off.
- Forge components that use hooks require `ForgePayloadProvider` above the workspace tree.
- In Studio, React Query must resolve to one module instance for host and package code (`apps/studio/next.config.mjs` aliases for webpack and Turbopack). Duplicate `@tanstack/react-query` instances cause `No QueryClient set`.
- Studio demo data seeding is idempotent: `apps/studio/payload/seeds/graph-seeds.ts` creates missing fixture graphs for `Demo Project` and updates `projects.narrativeGraph` when needed; do not switch back to unconditional graph rewrites on startup.
- Forge project switcher reads should stay lightweight/retryable (`depth=0`, retry with backoff in `useForgeProjects`) and expose manual retry in the dropdown via shared `ProjectSwitcher` `onRetry`.
- Player composition is generated on demand (`/api/forge/player/composition`); do not persist composition as canonical data in this slice.
- Pixi runtime must stay client-only. Never initialize `pixi.js` or `@drincs/pixi-vn` in server code paths.
- Keep frame-cycle runtime behavior deferred even though schema hooks exist (`CompositionAnimationHint.frameCycle`).

## How to Test
- npm run build
- npm run typecheck:domains

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] <measurable criteria>
  - [ ] tests pass
- Constraints:
  - constants only for types
  - no cross-domain imports
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
