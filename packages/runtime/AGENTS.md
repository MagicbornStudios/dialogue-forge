# Runtime - AGENTS

## Purpose
- Execute dialogue graphs deterministically and produce frames/steps.

## Owner Map
- Execution engine: `packages/runtime/src/engine/`
- Runtime helpers: `packages/runtime/src/`

## Public API
- `execute-graph-to-frames`, engine types, runtime constants

## Critical Invariants
- Deterministic execution (no host imports, no UI).
- Shared types only; no domain UI or app imports.
- Never mutate input graphs; return new state/frames.

## Known Footguns
- Flag evaluation must respect `FLAG_VALUE_TYPE` constants.
- Keep runtime pure (no timers, randomness, or DOM).

## How to Test
- `npm run test`
- `npm run typecheck:domains`

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] deterministic output matches fixtures
  - [ ] tests pass
- Constraints:
  - no host imports
  - no UI dependencies
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
