# File Placement Decision Tree

Use this decision tree to place new files consistently with the reorg plan and the boundary model.

## Decision Tree

1. **Does the file need Next.js, PayloadCMS, or runtime host wiring?**
   - **Yes** → Place in **Host (app/)**.
   - **No** → Continue.

2. **Is it AI infrastructure, contracts, or domain AI adapters?**
   - **Yes** → Place in **AI (src/ai/)**.
   - **No** → Continue.

3. **Is it reusable across Forge and Writer?**
   - **Yes** → Place in **Shared (src/shared/)**.
   - **No** → Continue.

4. **Is it Forge- or Writer-specific?**
   - **Forge** → Place in **Domain (src/forge/)**.
   - **Writer** → Place in **Domain (src/writer/)**.

## Monorepo Note

After the monorepo migration, replace the paths above with:

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

- [ ] Needs Next.js, PayloadCMS, or host wiring? → **Host (app/)**.
- [ ] Reused across Forge + Writer? → **Shared (src/shared/)**.
- [ ] Forge- or Writer-specific? → **Domain (src/forge/, src/writer/)**.
- [ ] AI infrastructure or AI contracts? → **AI (src/ai/)**.
- [ ] Confirm import direction rules (`src/**` never imports `app/**` or `app/payload-types.ts`).

## Non-Negotiable Boundary Rule

- **`src/**` must not import `app/**` or `app/payload-types.ts`.**

## Tie-Breaker: North Star Placement Rule

When uncertain, place code in the **lowest layer that can own it without depending on higher layers**. If later reused across domains, **promote it upward** from domain → shared.
