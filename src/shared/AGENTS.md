# Shared Domain - AGENTS

## Purpose
- Shared types, constants, utilities, and UI primitives.

## Owner Map
- Constants: src/shared/types/constants.ts
- UI primitives: src/shared/ui/
- Utilities: src/shared/utils/

## Public API
- Constants and shared types
- Shared UI components

## Critical Invariants
- Shared must not import from any other src domain or host.
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
- Output: <promise>COMPLETE</promise>
