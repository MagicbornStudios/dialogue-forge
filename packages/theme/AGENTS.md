# Theme Domain - AGENTS

## Purpose
- First-class theme workspace for project-scoped shadcn/ui theme authoring and AI generation.

## Owner Map
- Workspace shell: src/components/ThemeWorkspace/ThemeWorkspace.tsx
- Workspace store: src/components/ThemeWorkspace/store/theme-workspace-store.tsx
- Contracts: src/workspace/theme-workspace-contracts.ts
- Theme schema/defaults/codegen: src/theme/

## Public API
- ThemeWorkspace
- ThemeDataAdapter contracts
- Theme styles/schema utilities
- Theme code generation helpers

## Critical Invariants
- Theme package must not import from apps or other domain packages.
- Persistence and API integrations stay host-owned through adapters.
- Theme settings shape must stay versioned (`version: 1`).
- No draft slices and no event bus.

## Known Footguns
- Always normalize persisted settings before reading/writing.
- Keep `activeThemeId` valid when themes are added/removed.
- AI output must be merged with defaults to avoid missing token keys.

## How to Test
- pnpm --filter @magicborn/theme run typecheck
- pnpm run typecheck:domains

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] contracts stable
  - [ ] tests/typecheck pass
- Constraints:
  - no host imports
  - no cross-domain imports
  - no draft slices / no event bus
- Output: <promise>COMPLETE</promise>
