# Forge migration focus

**Current focus:** ForgeWorkspace, dialogue nodes, and **producing a complete Yarn Spinner file from a narrative/dialogue graph** (including resolving referenced graphs). Writer and narrative↔page linking are **out of scope for now**; narrative nodes are treated as **structure only** (e.g. Page, Detour, Jump).

## What we are migrating (forge-only)

- **Graph types** — ForgeGraphDoc, ForgeNode types (CHARACTER, PLAYER, CONDITIONAL, STORYLET, DETOUR, etc.), narrative structure nodes (PAGE, JUMP, END).
- **ForgeWorkspace** — Store, graph list, breadcrumbs, editor chrome (no edge-drop).
- **Nodes & inspector** — Character, Player, Conditional, Storylet, Detour (and narrative Page, Detour, Jump); per-type inspector fields; FlagSelector, CharacterSelector, condition inputs.
- **Yarn pipeline** — exportToYarn (with workspace context for storylet/detour resolution), importFromYarn; handlers; variable/condition formatting.

## What we are not doing (for now)

- **Writer** — Not migrating Writer workflows or Notion-style pages.
- **Linking narrative to pages** — Narrative graph nodes do not link to Writer PageDocs; listPages is not scoped by narrative graph. Narrative graph = structure only (which graph goes where, detours, jumps).

## Goal

**Generate a complete Yarn file from any graph that is meant to produce Yarn Spinner output**, resolving other graphs (storylet/detour) so the output is self-contained and valid for any consumer (our graph runner or a Yarn VM).

## Data access and export (forge-agent)

- **Data access:** Do **not** use data adapters. Use **React Query** with the **Payload CMS SDK**: hooks such as `useForgeGraph(id)`, `useForgeGraphs(projectId, kind)`, and mutations that call `payloadSdk.find`, `payloadSdk.findByID`, `payloadSdk.create`, `payloadSdk.update` on the forge-graphs collection. See [55-data-access-and-export.md](55-data-access-and-export.md).
- **Export resolution:** **Server-side.** Full Yarn export (with storylet/detour resolution) is performed on the server so all referenced graphs can be loaded and inlined. The client can show a **preview** (e.g. current graph only or best-effort); **full export** is requested from the server and returns the complete Yarn string.

## Docs to keep re-reading for forge migration

- [00-index.md](00-index.md) — Entry point and document list.
- [12-yarn-spinner-alignment.md](12-yarn-spinner-alignment.md) — Our node types → Yarn; export/import pipeline.
- [30-plan-yarn-and-graph-types.md](30-plan-yarn-and-graph-types.md) — Graph types and yarn-converter port.
- [31-plan-nodes-and-inspector.md](31-plan-nodes-and-inspector.md) — Nodes and inspector (no Writer link).
- [33-plan-dialogue-editor-chrome.md](33-plan-dialogue-editor-chrome.md) — ForgeWorkspace chrome.
- [50-game-state-and-player.md](50-game-state-and-player.md) — Game state, variable storage, graph runner (no WASM).
- [51-flag-manager-and-flattening.md](51-flag-manager-and-flattening.md) — Game flags, stats, flattening rules, complex examples.
- [52-yarn-spinner-variables-flattening-caveats.md](52-yarn-spinner-variables-flattening-caveats.md) — Why we flatten; Yarn VM variable expectations; caveats; decisions.
- [53-forge-yarn-export-goal-next-steps.md](53-forge-yarn-export-goal-next-steps.md) — Goal, next steps, resolved/remaining questions.
- [54-migration-roadmap.md](54-migration-roadmap.md) — Phased migration roadmap, technical context links, known issues.
- [55-data-access-and-export.md](55-data-access-and-export.md) — Data access (React Query + Payload), export resolution (server-side, preview vs full).

## Codebase anchors

- **Yarn export:** `packages/forge/src/lib/yarn-converter/` — index (exportToYarn, importFromYarn), handlers, workspace-context, runtime-export, variable-handler.
- **Game state / flattening:** `packages/forge/src/lib/game-player/game-state-flattener.ts`, `packages/shared/src/types/forge-game-state.ts`.
- **Graph types:** `packages/shared/src/types/forge-graph.ts`, `packages/forge/src/types/forge-graph.ts` (if split).
