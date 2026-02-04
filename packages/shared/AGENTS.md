# Shared Domain - AGENTS

## Purpose
- Shared types, constants, utilities, and UI primitives.

## Owner Map
- Constants: src/types/constants.ts
- UI primitives: src/ui/
- Utilities: src/utils/

## Public API
- Constants and shared types
- Shared UI components

## Critical Invariants
- Shared must not import from any other package or host.
- No string literals for discriminated types.

## Known Footguns
- Changes in constants ripple across domains; update refs carefully.
- Keep shared utilities pure (no side effects).

## How to Test
- npm run typecheck:domains
- npm run test

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] constants updated and referenced
  - [ ] tests pass
- Constraints:
  - no host imports
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
