# Glossary

## Host (app/)

- Next.js + PayloadCMS application code.
- Owns runtime integration, API routes, and generated types.
- Host may import from src/ (shared/domain/ai).

## Shared (src/shared/)

- Cross-domain types, utilities, and UI primitives.
- Lowest common layer used by domain packages.
- No dependencies on host or domain-specific packages.

## Domains (src/forge/, src/writer/)

- Domain-specific types, stores, components, and libraries.
- May depend on shared and AI layers.
- Forge ↔ Writer cross-imports are prohibited.

## AI (src/ai/)

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
