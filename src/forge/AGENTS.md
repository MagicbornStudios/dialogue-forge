# Forge Domain - AGENTS

## Purpose
- Visual graph editor for dialogue trees and narrative graphs.

## Owner Map
- Forge workspace shell: src/forge/components/ForgeWorkspace/ForgeWorkspace.tsx
- Graph editors: src/forge/components/ForgeWorkspace/components/GraphEditors/
- Runtime (execution): src/forge/runtime/

## Public API
- DialogueGraphEditor
- ForgeWorkspace
- Yarn import/export helpers

## Folder Map
- src/forge/components: UI
- src/forge/utils: graph helpers
- src/forge/runtime: execution engine
- src/forge/types: forge-specific types

## Critical Invariants
- Use NODE_TYPE/FLAG_TYPE/VIEW_MODE constants.
- Forge must not import Writer or host types.
- useGraphAutoSave + useSimpleForgeFlowEditor for save paths.

## Do / Don't
- Do keep changes localized and reviewable.
- Do prefer shared utils for reused logic.
- Don't introduce string literals for type checks.

## Known Footguns
- Draft vs committed graph: keep updates immutable.
- Graph deletion must use dataAdapter.deleteGraph + actions.removeGraph.

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
- Output: <promise>COMPLETE</promise>
