# Glossary

## Host (app/)

- Next.js + PayloadCMS application code.
- Owns runtime integration, API routes, and generated types.
- Host may import from packages/* (shared/domain/ai).

## Shared (packages/shared/src/)

- Cross-domain types, utilities, and UI primitives.
- Lowest common layer used by domain packages.
- No dependencies on host or domain-specific packages.

## Domains (packages/forge/src/, packages/writer/src/, packages/video/src/, packages/characters/src/)

- Domain-specific types, stores, components, and libraries.
- May depend on shared + runtime (and AI for CopilotKit wiring).
- Forge ↔ Writer cross-imports are prohibited. Forge may import Video types/renderers for playback.

## AI (packages/ai/src/)

- Shared AI infrastructure and domain AI adapters.
- Can depend on shared types/utilities.
- Domain layers can depend on AI, never the reverse.

## Workspace Store

- Domain state, persistent, slice-based, emits events.

## Editor Session Store

- Per-instance UI state, ephemeral, editor-specific.

## Editor Shell

- Bridge between editor library and domain, handles events, provides dispatch.

## Command Pattern

- Typed actions via dispatch, testable, consistent.

## Modal Management

- Workspace store viewState slice + modal switcher component.



