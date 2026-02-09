# Decisions

Architecture decisions for dialogue-forge migration alignment.

## ADR-001: Forge-agent canonical alignment

Decision:
- Treat `forge-agent` as canonical target for editor-platform contracts and collection direction.

Rationale:
- Minimizes divergence and migration friction.
- Keeps this repo focused as consumer/playground validation ground.

## ADR-002: Non-breaking schema transition

Decision:
- Add canonical schemas and APIs in parallel while preserving existing running flows.

Rationale:
- Avoid regressions in active Forge/Writer functionality during transition.

## ADR-003: Markdown-only docs in dialogue-forge

Decision:
- Use `.md` only for new governance/strategy docs in this repo.

Rationale:
- Faster authoring and maintenance while still aligning information architecture with forge-agent.

## ADR-004: Writer pages+blocks coexistence strategy

Decision:
- Keep legacy page blob fields (`bookBody`, `content`) during transition.
- Add `blocks` as canonical-compatible path and provide mapper/fallback strategy.

Rationale:
- Enables incremental migration without immediate field deprecation risk.

## ADR-005: Artifact-driven agent operations

Decision:
- Operational truth is maintained in `docs/agent-artifacts/core/*` with indexed entrypoints in docs and root governance files.

Rationale:
- Makes work discoverable and repeatable across humans/agents.

## ADR-006: Game player stack and composition

Decision:
- Use **Pixi'VN** as the dialogue/game player engine. React for UI (menus, HUD).
- One **composition** format (elements + timing + animation) as the shared contract between player and animation editor (timeline). Animation editor is the timeline editor for that composition; "video" in naming is Canva-style (outputs video).
- Electron for packaged builds; Framer Motion for UI motion; particle lib (e.g. tsparticles) and sprite frame cycling in scope.

Rationale:
- Aligns with product direction: scale (Pixi), clear data contract (composition), and path to "edit on timeline" without a second ad-hoc format.

## ADR-007: On-demand composition and deferred frame-cycle runtime

Decision:
- Generate `ForgeCompositionV1` on demand from graphs (server route + local fallback), instead of persisting composition snapshots in collection docs for now.
- Include frame-cycle fields in schema (`CompositionAnimationHint.frameCycle`) but defer runtime frame-cycle playback behavior to a follow-on slice.

Rationale:
- Keeps first player MVP non-breaking and fast to iterate.
- Preserves forward compatibility for animation/timeline workflows without blocking immediate player delivery.
