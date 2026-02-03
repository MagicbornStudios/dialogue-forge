# Characters Domain - AGENTS

## Purpose
- Character workspace and relationship graph editing.

## Owner Map
- Workspace shell: src/characters/components/CharacterWorkspace/CharacterWorkspace.tsx
- Store: src/characters/components/CharacterWorkspace/store/

## Public API
- CharacterWorkspace
- CharacterWorkspaceAdapter contracts

## Critical Invariants
- Adapters are contracts only; host implements them.
- No imports from host or other domains.

## Known Footguns
- Autosave must debounce and avoid loops.
- Graph updates should remain immutable.

## How to Test
- npm run build
- npm run typecheck:domains

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] adapter contract preserved
  - [ ] tests pass
- Output: <promise>COMPLETE</promise>
