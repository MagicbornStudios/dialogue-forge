# Writer Domain - AGENTS

## Purpose
- Narrative writing workspace and text editor flows.

## Owner Map
- Workspace shell: src/writer/components/WriterWorkspace/WriterWorkspace.tsx
- Lexical editor plugins: src/writer/components/WriterWorkspace/editor/

## Public API
- WriterWorkspace
- Narrative types

## Critical Invariants
- No imports from Forge, Video, or host app.
- Lexical editor state sync uses workspace store actions.
- Use constants for any type discriminators.

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
- Output: <promise>COMPLETE</promise>
