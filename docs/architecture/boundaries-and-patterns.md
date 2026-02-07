# Architecture boundaries and patterns

Merged from BOUNDARIES.md, PATTERNS.md, FILE-PLACEMENT.md, and GLOSSARY.md. Use for placement and import rules when reimplementing.

## Layer model (Host → Shared → Domain → AI)

**Host (apps/host/)**
- Next.js + PayloadCMS application code.
- Owns runtime integration, API routes, and generated types.
- Host may import from packages/* (shared, domain, ai).

**Shared (packages/shared/)**
- Cross-domain types, utilities, and UI primitives.
- Lowest common layer used by domain packages.
- No dependencies on host or domain-specific packages.

**Domains (packages/forge/, packages/writer/, packages/video/, packages/characters/)**
- Domain-specific types, stores, components, and libraries.
- May depend on shared (and AI for CopilotKit wiring).
- Forge ↔ Writer cross-imports are prohibited. Forge may import Video types/renderers for playback; avoid new cross-domain links.

**AI (packages/ai/)**
- Shared AI infrastructure and domain AI adapters.
- Can depend on shared types/utilities.
- Domain layers can depend on AI, never the reverse.

## Import direction rules

1. Host may import from packages/* (shared, domain, ai).
2. packages/* may not import from apps/host/ or apps/host/app/payload-types.ts.
3. Domains may import from shared + runtime (and AI for CopilotKit wiring).
4. Domains may not import each other (Forge ↔ Writer). Forge → Video is an approved exception for playback types/renderers.
5. AI may not import from domains or host.

## North star placement rule

Place code in the **lowest layer that can own it without depending on higher layers.** If later reused across domains, promote it upward from domain → shared.

- Needs PayloadCMS, Next.js, or app wiring → Host.
- Reusable across Forge and Writer → Shared.
- Forge- or Writer-specific → Domain.
- AI infrastructure or contracts → AI.

## File placement decision tree

1. Does the file need Next.js, PayloadCMS, or runtime host wiring? → **Host (apps/host/)**.
2. Is it AI infrastructure, contracts, or domain AI adapters? → **AI (packages/ai/)**.
3. Is it reusable across Forge and Writer? → **Shared (packages/shared/)**.
4. Is it Forge- or Writer-specific? → **Domain (packages/forge/ or packages/writer/)**.

Tie-breaker: lowest layer that can own it.

## File requirements (patterns)

- **Types and constants:** Prefer shared `constants.ts`; never string literals for discriminators. Domain types in domain `types/` and re-export via index.
- **Components:** One component per file unless tightly coupled. Shared UI in packages/shared.
- **Utilities:** Reusable in shared/utils; domain-only in domain utils/.
- **Adapters:** Interfaces in domain packages; host implements and passes in. Domain must not import host types.

## Action and event naming

- Format: `domain:action` / `domain:event`; lowercase, hyphenated (e.g. `forge:open-node`).
- Domain prefixes: `forge:`, `writer:`, `ai:`, `shared:` (sparingly), `host:`.
- Actions = imperative (create, delete, reorder). Events = past tense or stateful (created, deleted, reordered).

## Glossary (short)

- **Workspace store:** Domain state, persistent, slice-based.
- **Editor session store:** Per-instance UI state, ephemeral, editor-specific.
- **Editor shell:** Bridge between editor library and domain; events and dispatch.
- **Command pattern:** Typed actions via dispatch, testable.
- **Modal management:** Workspace viewState slice + modal switcher.
