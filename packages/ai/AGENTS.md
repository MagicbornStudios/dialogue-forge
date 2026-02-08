# AI Domain - AGENTS

## Purpose
- AI infrastructure and adapters used by domains.

## Owner Map
- CopilotKit integration: src/copilotkit/
- Domain AI adapters: src/adapters/

## Public API
- AI providers, runtime helpers, and CopilotKit wiring

## Critical Invariants
- AI domain imports only shared types/utilities.
- No imports from Forge/Writer/Video or host app.

## Known Footguns
- Provider keys and runtime config must remain host-owned.
- Avoid side effects in shared AI helpers.
- `CopilotKitProvider` defaults to `runtimeUrl=/api/copilotkit`; verify host route exists before enabling UI.
- Theme generation and Copilot runtime now share strict free-model routing policy in host (`OPENROUTER_THEME_MODELS_FREE` preferred, with free `OPENROUTER_MODEL_FAST` / `AI_DEFAULT_MODEL` fallback); runtime requests must not use paid models.
- Host-facing AI endpoints should fail fast with explicit error codes for missing API key/model-chain config.

## How to Test
- npm run typecheck:domains
- npm run test

## Prompt Templates

Task:
- Goal: <one sentence>
- Completion:
  - [ ] API surface documented
  - [ ] tests pass
- Constraints:
  - no host imports
  - no domain imports (forge/writer/video/characters)
- Output: <promise>COMPLETE</promise>

Bugfix (TDD preferred):
1. Write failing test (if feasible)
2. Fix
3. Run tests
4. Repeat
5. Output: <promise>COMPLETE</promise>
