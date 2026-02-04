# Video Domain - AGENTS

## Purpose
- Video templates, compilation pipeline, and workspace surface.
- Host app uses Twick Studio via VideoWorkspaceTwick.

## Owner Map
- Workspace surface: src/workspace/VideoWorkspaceTwick.tsx
- Contracts: src/workspace/video-template-workspace-contracts.ts
- Templates + compile pipeline: src/templates/
- Player: src/player/

## Public API
- VideoWorkspace / VideoWorkspaceTwick
- Video template types and compile helpers
- VideoTemplateWorkspaceAdapter + media contracts

## Folder Map
- src/templates: types + compilation helpers
- src/workspace: Twick wrapper + contracts
- src/player: Remotion renderer
## Critical Invariants
- Twick Studio is the canonical editor surface.
- Adapter contracts live in video-template-workspace-contracts.ts.
- No host imports from src/ (keep domain portable).
- Use constants for discriminated types (no string literals).
- No draft slices or event bus in new work.

## Do / Don't
- Do keep VideoWorkspaceTwick thin (no app wiring inside).
- Do pass contextId for persistence/undo scopes.
## Known Footguns
- Twick CSS must be loaded once (app/layout.tsx).
- TimelineProvider contextId controls persistence/undo scope.

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
  - Twick wrapper stays thin
  - No host imports in src/video
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
