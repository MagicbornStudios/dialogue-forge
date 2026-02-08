# Forge Domain - AGENTS

## Purpose
- Visual graph editor for dialogue trees and narrative graphs.

## Owner Map
- Forge workspace shell: src/components/ForgeWorkspace/ForgeWorkspace.tsx
- Graph editors: src/components/ForgeWorkspace/components/GraphEditors/
- Runtime types: packages/shared/src/types/runtime.ts (execution engine removed)

## Public API
- DialogueGraphEditor
- ForgeWorkspace
- Yarn import/export helpers

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

## Do / Don't
- Do keep changes localized and reviewable.
- Do prefer shared utils for reused logic.
- Don't introduce string literals for type checks.

## Known Footguns
- Graph deletion must use dataAdapter.deleteGraph + actions.removeGraph.
- Forge workspace content area (menu bar + layout): the layout must be wrapped in a container with `flex-1 min-h-0` (and optionally `overflow-hidden`) so it gets bounded height; otherwise the bottom (storylet) panel is cut off.

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
