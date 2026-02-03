# AI Domain - AGENTS

## Purpose
- AI infrastructure and adapters used by domains.

## Owner Map
- CopilotKit integration: src/ai/
- Domain AI adapters: src/ai/adapters/

## Public API
- AI providers, runtime helpers, and CopilotKit wiring

## Critical Invariants
- AI domain imports only shared types/utilities.
- No imports from Forge/Writer/Video or host app.

## Known Footguns
- Provider keys and runtime config must remain host-owned.
- Avoid side effects in shared AI helpers.

## How to Test
- npm run typecheck:domains
- npm run test

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] API surface documented
  - [ ] tests pass
- Output: <promise>COMPLETE</promise>
