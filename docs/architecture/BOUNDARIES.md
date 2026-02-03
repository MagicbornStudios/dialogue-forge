# Architecture Boundaries

## Layer Model (Host → Shared → Domain → AI)

**Host (app/)**
- Next.js + PayloadCMS application code.
- Owns runtime integration, API routes, and generated types.
- **Host may import from src/** (shared/domain/ai).

**Shared (src/shared/)**
- Cross-domain types, utilities, and UI primitives.
- Lowest common layer used by domain packages.
- No dependencies on host or domain-specific packages.

**Domains (src/forge/, src/writer/)**
- Domain-specific types, stores, components, and libraries.
- May depend on shared and AI layers.
- **Forge ↔ Writer cross-imports are prohibited.**

**AI (src/ai/)**
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

1. **Host may import from src/** (shared, domain, ai).
2. **src/** may not import from **app/** or `app/payload-types.ts`.
3. **Domains may import from shared and ai only.**
4. **Domains may not import each other** (Forge ↔ Writer).
5. **AI may not import from domains or host.**

### Monorepo Equivalent Rules

1. **apps/host may import from packages/**.
2. **packages/** may not import from **apps/host/**.
3. **Domain packages may import from shared and runtime only.**
4. **Domain packages may not import each other.**
5. **AI may import from shared only.**

## Placement Checklist (for new files)

- [ ] Does it reference PayloadCMS, Next.js routing, or app runtime wiring? → **Host**.
- [ ] Is it reusable across Forge and Writer? → **Shared**.
- [ ] Is it specific to Forge or Writer workflows? → **Domain**.
- [ ] Is it AI infrastructure or AI contracts? → **AI**.
- [ ] Does it violate import direction rules? → **Move it down** to the lowest valid layer.
- [ ] **Verify `src/**` does not import `app/**` or `app/payload-types.ts`.**
