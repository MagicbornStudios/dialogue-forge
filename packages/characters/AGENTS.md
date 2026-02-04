# Characters Domain - AGENTS

## Purpose
- Character workspace and relationship graph editing.

## Owner Map
- Workspace shell: src/components/CharacterWorkspace/CharacterWorkspace.tsx
- Store: src/components/CharacterWorkspace/store/

## Public API
- CharacterWorkspace
- CharacterWorkspaceAdapter contracts

## Critical Invariants
- Adapters are contracts only; host implements them.
- No imports from host or other domains.
- No draft slices or event bus in new work.

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
- Constraints:
  - no host imports
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
