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
- No imports from Forge, Video, or host app.
- Lexical editor state sync uses workspace store actions.
- Use constants for any type discriminators.
- No draft slices or event bus in new work.

## Known Footguns
- Editor sync plugins must avoid infinite loops.
- Keep autosave debounced and explicit.

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
