# Architecture Patterns

This document captures common patterns for placement, file structure, and action/event naming. Use it alongside the boundary rules and placement decision tree.

## Folder Placement Patterns

### Host (apps/host/)
- Runtime wiring: Next.js routes, PayloadCMS collections, server actions.
- App-only adapters and transformations that depend on PayloadCMS or Next.js APIs.
- UI that only exists in the demo app (layout, pages, demo-specific components).

### Shared (packages/shared/ or packages/shared/src/)
- Cross-domain types, UI primitives, and utilities.
- Reusable schemas, constants, and helper functions.
- UI components that are used by both Forge and Writer.

### Domains (packages/forge/, packages/writer/, packages/video/, packages/characters/)
- Domain-specific types, stores, and UI components.
- Domain-only adapters and workflow logic.
- Keep Forge and Writer isolated (no cross-imports). Forge -> Video is an approved exception for playback types/renderers.

### AI (packages/ai/ or packages/ai/src/)
- Model routing, streaming helpers, and AI infrastructure.
- Domain AI adapters that depend on shared types.
- No imports from domains or host.

## File Requirements

### Types and Constants
- Prefer adding new constants in `packages/shared/src/types/constants.ts` (or packages/shared once extracted).
- Never use string literals for type discriminators—use exported constants.
- Keep domain-specific types in `packages/forge/src/types/` or `packages/writer/src/types/` and re-export through the domain index.

### Components
- One component per file unless helpers are tightly coupled.
- Use `V2` suffix for modern Forge components (e.g., `NPCNodeV2`).
- Shared UI primitives live in `packages/shared/src/`.

### Utilities
- Put reusable helpers in `packages/shared/src/utils/`.
- Domain-only helpers live in the domain `utils/` folder.
- Avoid duplicating helpers; promote shared logic upward when reused across domains.

### Imports and Boundaries
- `packages/**` must never import from `apps/host/**` or `apps/host/app/payload-types.ts`.
- Domains may import from shared + runtime (and AI for CopilotKit wiring).
- Forge and Writer must not import each other.

### Adapters as Contracts
- Adapters are interfaces defined in domain packages.
- Host apps implement adapters and pass them into workspace components.
- Domain code must never import host types or host wiring.

## Action & Event Naming

### Naming Format
- Use `domain:action` for actions and `domain:event` for events.
- Use lowercase, hyphenated verbs/nouns when needed (e.g., `forge:open-node`).
- Include specific targets for clarity (e.g., `writer:chapter-created`).

### Domain Prefixes
- `forge:` for graph editor actions/events.
- `writer:` for workspace/editor actions/events.
- `ai:` for AI-related actions/events.
- `shared:` for cross-domain actions/events (use sparingly).
- `host:` for demo app or PayloadCMS integration events.

### Action Examples
- `forge:node-create`
- `forge:node-delete`
- `writer:chapter-create`
- `writer:chapter-reorder`
- `ai:stream-start`
- `host:payload-sync`

### Event Examples
- `forge:node-created`
- `forge:node-deleted`
- `writer:chapter-created`
- `writer:chapter-reordered`
- `ai:stream-started`
- `host:payload-synced`

### Naming Rules
- Actions are imperative verbs (create, delete, reorder).
- Events are past tense or stateful (created, deleted, reordered, synced).
- Keep names stable; avoid renames unless they fix clear ambiguity.
- Do not overload one action/event with multiple meanings.


