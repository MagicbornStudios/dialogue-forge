# Migration and building docs — Index

For agents. This folder is the canonical place for migration and building docs (parity, game player, writer, alignment).

## Purpose

Migrate Writer and ForgeWorkspace nodes and Yarn implementation from dialogue-forge into forge-agent.
Do not migrate edge-drop (see [strategy/11-out-of-scope.md](strategy/11-out-of-scope.md)).

## Forge focus (current)

**Current priority:** ForgeWorkspace, dialogue nodes, and **producing a complete Yarn file from any graph** (with storylet/detour resolution). Writer and narrative↔page linking are **out of scope for now**; narrative nodes = structure only. Goal and next steps: [forge/53-forge-yarn-export-goal-next-steps.md](forge/53-forge-yarn-export-goal-next-steps.md).

**What we are migrating (forge-only):** Graph types (ForgeGraphDoc, ForgeNode types, narrative PAGE/JUMP/END); ForgeWorkspace (store, graph list, breadcrumbs, chrome, no edge-drop); nodes & inspector (Character, Player, Conditional, Storylet, Detour, narrative Page/Detour/Jump); Yarn pipeline (exportToYarn, importFromYarn, handlers).

**What we are not doing (for now):** Writer workflows; linking narrative to Writer pages. Writer docs: [forge/21-writer-forge-inventory.md](forge/21-writer-forge-inventory.md), [forge/32-plan-writer-and-pages.md](forge/32-plan-writer-and-pages.md), [writer/60-writer-features-and-requirements.md](writer/60-writer-features-and-requirements.md), [writer/61-writer-current-implementation.md](writer/61-writer-current-implementation.md), [writer/62-writer-migration-roadmap.md](writer/62-writer-migration-roadmap.md).

**Goal:** Generate a complete Yarn file from any graph meant for Yarn Spinner output, resolving storylet/detour so output is self-contained and valid for any consumer.

**Data access and export (forge-agent):** Do **not** use data adapters. Use **React Query** with **Payload CMS SDK** (e.g. `useForgeGraph(id)`, `useForgeGraphs(projectId, kind)`). See [forge/55-data-access-and-export.md](forge/55-data-access-and-export.md). **Export resolution:** server-side; full Yarn export with storylet/detour resolution on the server; client can show preview.

**Docs to re-read for forge migration:** This index; [forge/12-yarn-spinner-alignment.md](forge/12-yarn-spinner-alignment.md); [forge/30](forge/30-plan-yarn-and-graph-types.md), [forge/31](forge/31-plan-nodes-and-inspector.md), [forge/33](forge/33-plan-dialogue-editor-chrome.md); [game-player/50](game-player/50-game-state-and-player.md), [game-player/51](game-player/51-flag-manager-and-flattening.md), [game-player/52](game-player/52-yarn-spinner-variables-flattening-caveats.md); [forge/53](forge/53-forge-yarn-export-goal-next-steps.md), [forge/54](forge/54-migration-roadmap.md), [forge/55](forge/55-data-access-and-export.md), [game-player/64](game-player/64-game-player-tech-design-and-roadmap.md).

**Codebase anchors:** Yarn export: `packages/forge/src/lib/yarn-converter/`; game state/flattening: `packages/forge/src/lib/game-player/game-state-flattener.ts`, `packages/shared/src/types/forge-game-state.ts`; game player: [game-player/64-game-player-tech-design-and-roadmap.md](game-player/64-game-player-tech-design-and-roadmap.md); graph types: `packages/shared/src/types/forge-graph.ts`.

## Before you start

1. Read [strategy/01-agent-strategy-migration.md](strategy/01-agent-strategy-migration.md).
2. Read [strategy/11-out-of-scope.md](strategy/11-out-of-scope.md).
3. Read the specific plan you are executing (e.g. forge/30–33) and [docs/agent-artifacts/core/STATUS.md](../../agent-artifacts/core/STATUS.md).

## After each slice

Update the plan Done list and Next section, then update [docs/agent-artifacts/core/MIGRATION.md](../../agent-artifacts/core/MIGRATION.md) with a one-line "Done" entry.

## Document list (by folder)

**strategy/** — Entry, scope, parity, out-of-scope
- [strategy/01-agent-strategy-migration.md](strategy/01-agent-strategy-migration.md)
- [strategy/10-parity-overview.md](strategy/10-parity-overview.md)
- [strategy/11-out-of-scope.md](strategy/11-out-of-scope.md)

**forge/** — Inventories, Yarn/graph/nodes/chrome, ideas, roadmap, data access
- [forge/12-yarn-spinner-alignment.md](forge/12-yarn-spinner-alignment.md)
- [forge/20-dialogue-forge-inventory.md](forge/20-dialogue-forge-inventory.md)
- [forge/21-writer-forge-inventory.md](forge/21-writer-forge-inventory.md)
- [forge/22-node-and-inspector-mapping.md](forge/22-node-and-inspector-mapping.md)
- [forge/30-plan-yarn-and-graph-types.md](forge/30-plan-yarn-and-graph-types.md)
- [forge/31-plan-nodes-and-inspector.md](forge/31-plan-nodes-and-inspector.md)
- [forge/32-plan-writer-and-pages.md](forge/32-plan-writer-and-pages.md)
- [forge/33-plan-dialogue-editor-chrome.md](forge/33-plan-dialogue-editor-chrome.md)
- [forge/40-ideas-and-concerns.md](forge/40-ideas-and-concerns.md)
- [forge/53-forge-yarn-export-goal-next-steps.md](forge/53-forge-yarn-export-goal-next-steps.md)
- [forge/54-migration-roadmap.md](forge/54-migration-roadmap.md)
- [forge/55-data-access-and-export.md](forge/55-data-access-and-export.md) — Data access (React Query + Payload), export resolution (server-side, preview vs full).

**game-player/** — Game state, flags, variables, player tech and roadmap
- [game-player/50-game-state-and-player.md](game-player/50-game-state-and-player.md)
- [game-player/51-flag-manager-and-flattening.md](game-player/51-flag-manager-and-flattening.md)
- [game-player/52-yarn-spinner-variables-flattening-caveats.md](game-player/52-yarn-spinner-variables-flattening-caveats.md)
- [game-player/64-game-player-tech-design-and-roadmap.md](game-player/64-game-player-tech-design-and-roadmap.md) — Tech, design, one template, roadmap, decisions, what's next.

**writer/** — Writer features, implementation, roadmap, pages/blocks
- [writer/60-writer-features-and-requirements.md](writer/60-writer-features-and-requirements.md)
- [writer/61-writer-current-implementation.md](writer/61-writer-current-implementation.md)
- [writer/62-writer-migration-roadmap.md](writer/62-writer-migration-roadmap.md)
- [writer/63-writer-pages-blocks-and-reorder.md](writer/63-writer-pages-blocks-and-reorder.md)

**alignment/** — Collection matrix, workspace-to-editor readiness
- [alignment/65-collection-alignment-matrix.md](alignment/65-collection-alignment-matrix.md)
- [alignment/66-workspace-to-editor-readiness.md](alignment/66-workspace-to-editor-readiness.md)

## Open questions

- **Composition schema** — Exact fields and ownership; Pixi'VN consumes it or we export from their state? → [game-player/64-game-player-tech-design-and-roadmap.md](game-player/64-game-player-tech-design-and-roadmap.md).
- **Forge graph → Pixi'VN** — Adapter shape: graph → composition → Pixi'VN, or graph → their narrative/JSON API directly? → [game-player/64-game-player-tech-design-and-roadmap.md](game-player/64-game-player-tech-design-and-roadmap.md).
- **Animation editor** — Same composition format as player input, or import from Pixi'VN state? How does timeline get keyframes? → [game-player/64-game-player-tech-design-and-roadmap.md](game-player/64-game-player-tech-design-and-roadmap.md).
- **Electron + Pixi'VN** — Any packaging or native-module constraints to validate early. → [game-player/64-game-player-tech-design-and-roadmap.md](game-player/64-game-player-tech-design-and-roadmap.md).
- **Writer / Forge focus** — Any change to "Writer deferred" given doc cleanup and alignment? → [forge/40-ideas-and-concerns.md](forge/40-ideas-and-concerns.md).

## Links

- [Agent artifacts index](../../agent-artifacts/README.md)
- [Root AGENTS.md](../../../AGENTS.md)
- [Numbered guides](../../guides/README.md)



## Latest addition

- [game-player/67-pixivn-composition-contract-and-adapter.md](game-player/67-pixivn-composition-contract-and-adapter.md) - Canonical composition contract, graph adapter mapping, and Pixi'VN integration examples.

