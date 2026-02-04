# File Placement Decision Tree

Use this decision tree to place new files consistently with the reorg plan and the boundary model.

## Decision Tree

1. **Does the file need Next.js, PayloadCMS, or runtime host wiring?**
   - **Yes** → Place in **Host (apps/host/)**.
   - **No** → Continue.

2. **Is it AI infrastructure, contracts, or domain AI adapters?**
   - **Yes** → Place in **AI (packages/ai/ or packages/ai/src/)**.
   - **No** → Continue.

3. **Is it reusable across Forge and Writer?**
   - **Yes** → Place in **Shared (packages/shared/ or packages/shared/src/)**.
   - **No** → Continue.

4. **Is it Forge- or Writer-specific?**
   - **Forge** → Place in **Domain (packages/forge/ or packages/forge/src/)**.
   - **Writer** → Place in **Domain (packages/writer/ or packages/writer/src/)**.

## Monorepo Note

Current package paths:

- Host → `apps/host/`
- Shared → `packages/shared/`
- Runtime → `packages/runtime/`
- Domains → `packages/forge/`, `packages/writer/`, `packages/video/`, `packages/characters/`
- AI → `packages/ai/`

## Quick Examples

- PayloadCMS collections, API routes, or server wiring → **Host**.
- AI adapters, model routing, streaming helpers → **AI**.
- Shared types, UI primitives, utilities → **Shared**.
- Forge graph editor or Writer workspace UI → **Domain**.

## How to Place New Files (Checklist)

- [ ] Needs Next.js, PayloadCMS, or host wiring? → **Host (apps/host/)**.
- [ ] Reused across Forge + Writer? → **Shared (packages/shared/ or packages/shared/src/)**.
- [ ] Forge- or Writer-specific? → **Domain (packages/forge/ or packages/forge/src/)**.
- [ ] AI infrastructure or AI contracts? → **AI (packages/ai/ or packages/ai/src/)**.
- [ ] Confirm import direction rules (`packages/**` never imports `apps/host/**` or `apps/host/app/payload-types.ts`).

## Non-Negotiable Boundary Rule

- **`packages/**` must not import `apps/host/**` or `apps/host/app/payload-types.ts`.**

## Tie-Breaker: North Star Placement Rule

When uncertain, place code in the **lowest layer that can own it without depending on higher layers**. If later reused across domains, **promote it upward** from domain → shared.
