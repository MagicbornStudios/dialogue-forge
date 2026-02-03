# Runtime - AGENTS

## Purpose
- Execute dialogue graphs deterministically and produce frames/steps.

## Owner Map
- Execution engine: src/forge/runtime/engine/
- Runtime helpers: src/forge/runtime/utils/

## Public API
- execute-graph-to-frames and related helpers

## Critical Invariants
- Deterministic execution (no host imports, no UI).
- Shared types only; no app or domain UI imports.

## Known Footguns
- Flag evaluation must respect FLAG_VALUE_TYPE constants.
- Runtime should not mutate input graphs.

## How to Test
- npm run test
- npm run typecheck:domains

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] deterministic output matches fixtures
  - [ ] tests pass
- Output: <promise>COMPLETE</promise>
