# Architecture Boundaries

## Layer Model (Host → Shared → Domain → AI)

**Host (apps/host/)**
- Next.js + PayloadCMS application code.
- Owns runtime integration, API routes, and generated types.
- **Host may import from packages/** (shared/domain/ai).

**Shared (packages/shared/ or packages/shared/src/)**
- Cross-domain types, utilities, and UI primitives.
- Lowest common layer used by domain packages.
- No dependencies on host or domain-specific packages.

**Domains (packages/forge/, packages/writer/, packages/video/, packages/characters/)**
- Domain-specific types, stores, components, and libraries.
- May depend on shared + runtime (and AI for CopilotKit wiring).
- **Forge ↔ Writer cross-imports are prohibited. Forge may import Video types/renderers for playback; avoid new cross-domain links.**

**AI (packages/ai/ or packages/ai/src/)**
- Shared AI infrastructure and domain AI adapters.
- Can depend on shared types/utilities.
- Domain layers can depend on AI, never the reverse.

## Target Monorepo Mapping (Packages + Apps)

When the monorepo migration is complete, the same layers map to packages:

- **Host** → `apps/host/`
- **Shared** → `packages/shared/`
- **Runtime** → `packages/runtime/`
- **Domains** → `packages/forge/`, `packages/writer/`, `packages/video/`, `packages/characters/`
- **AI** → `packages/ai/`
- **Umbrella** → `packages/dialogue-forge/` (re-exports domain APIs)

## North Star Placement Rule

> **Place code in the lowest layer that can own it without depending on higher layers.**

Practical guidance:
- If it must reference PayloadCMS, Next.js, or runtime app wiring → **Host**.
- If it is domain-specific and could ship in the package → **Domain**.
- If it is reusable across domains → **Shared**.
- If it is AI infrastructure or contracts → **AI**.

## Import Direction Rules

1. **Host may import from packages/** (shared, domain, ai).
2. **packages/** may not import from **apps/host/** or `apps/host/app/payload-types.ts`.
3. **Domains may import from shared + runtime (and AI for CopilotKit wiring).**
4. **Domains may not import each other** (Forge ↔ Writer). Forge -> Video is an approved exception for playback types/renderers.
5. **AI may not import from domains or host.**

### Monorepo Equivalent Rules

1. **apps/host may import from packages/**.
2. **packages/** may not import from **apps/host/**.
3. **Domain packages may import from shared + runtime (and AI for CopilotKit wiring).**
4. **Domain packages may not import each other.** Forge -> Video is an approved exception for playback types/renderers.
5. **AI may import from shared only.**

## Placement Checklist (for new files)

- [ ] Does it reference PayloadCMS, Next.js routing, or app runtime wiring? → **Host**.
- [ ] Is it reusable across Forge and Writer? → **Shared**.
- [ ] Is it specific to Forge or Writer workflows? → **Domain**.
- [ ] Is it AI infrastructure or AI contracts? → **AI**.
- [ ] Does it violate import direction rules? → **Move it down** to the lowest valid layer.
- [ ] **Verify `packages/**` does not import `apps/host/**` or `apps/host/app/payload-types.ts`.**



