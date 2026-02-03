# Video Domain - AGENTS

## Purpose
- Video templates, compilation pipeline, and workspace surface.
- Host app uses Twick Studio via VideoWorkspaceTwick.

## Owner Map
- Workspace surface: src/video/workspace/VideoWorkspaceTwick.tsx
- Contracts: src/video/workspace/video-template-workspace-contracts.ts
- Templates + compile pipeline: src/video/templates/
- Player: src/video/player/

## Public API
- VideoWorkspace / VideoWorkspaceTwick
- Video template types and compile helpers
- VideoTemplateWorkspaceAdapter + media contracts

## Folder Map
- src/video/templates: types + compilation helpers
- src/video/workspace: Twick wrapper + contracts
- src/video/player: Remotion renderer
## Critical Invariants
- Twick Studio is the canonical editor surface.
- Adapter contracts live in video-template-workspace-contracts.ts.
- No host imports from src/ (keep domain portable).
- Use constants for discriminated types (no string literals).

## Do / Don't
- Do keep VideoWorkspaceTwick thin (no app wiring inside).
- Do pass contextId for persistence/undo scopes.
## Known Footguns
- Twick CSS must be loaded once (app/layout.tsx).
- TimelineProvider contextId controls persistence/undo scope.
- VideoTemplateWorkspace is a deprecated compatibility wrapper.

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
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
