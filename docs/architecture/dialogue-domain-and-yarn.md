# Dialogue Domain and Yarn Spinner

Forge is the node-based dialogue editor. This doc captures graph kinds, storylet and detour behavior, and Yarn export paths.

## Graph Kinds

- `FORGE_GRAPH_KIND.NARRATIVE`: structure graph (acts, chapters, pages, storylet and detour calls).
- `FORGE_GRAPH_KIND.STORYLET`: dialogue graph (character, player, conditional, storylet, detour).

Store tracks:
- `graphs.byId`
- `activeNarrativeGraphId`
- `activeStoryletGraphId`
- breadcrumbs per scope

## Data Loading and Commit

- Forge data is loaded with package hooks in `packages/forge/src/data/forge-queries.ts`.
- Host provides payload client via `ForgePayloadProvider`.
- Draft commit uses `commitForgeDraft(draft, deltas, api)` where `api` has:
  - `createPage(...)`
  - `updateGraph(...)`

## Narrative Graph Editor

Node types include:
- `ACT`
- `CHAPTER`
- `PAGE`
- `CONDITIONAL`
- `DETOUR`
- `STORYLET`

Location:
- `packages/forge/src/components/ForgeWorkspace/components/GraphEditors/ForgeNarrativeGraphEditor/`

## Storylet Graph Editor

Node types include:
- `CHARACTER`
- `PLAYER`
- `CONDITIONAL`
- `STORYLET`
- `DETOUR`

Location:
- `packages/forge/src/components/ForgeWorkspace/components/GraphEditors/ForgeStoryletGraphEditor/`

## Storylets and Detours

`ForgeStoryletCall` stores:
- `mode` (`DETOUR_RETURN` or `JUMP`)
- `targetGraphId`
- `targetStartNodeId?`
- `returnNodeId?`
- `returnGraphId?`

Behavior:
- Storylet (`JUMP`) jumps to target graph start and continues there.
- Detour (`DETOUR_RETURN`) jumps to target graph and rewrites target end-node jumps back to `returnNodeId`.

## Yarn Export

- Single-graph export: `exportToYarn(graph)` with no workspace context.
- Multi-graph export: `exportToYarn(graph, createWorkspaceContext(store))` for storylet and detour graph resolution.
- Export pipeline uses converter handlers (character, player, conditional, storylet, detour) to emit Yarn blocks.

## Key Locations

- Forge root:
  - `packages/forge/src/components/ForgeWorkspace/ForgeWorkspace.tsx`
  - `packages/forge/src/data/ForgePayloadContext.tsx`
  - `packages/forge/src/data/forge-queries.ts`
- Store and slices:
  - `packages/forge/src/components/ForgeWorkspace/store/forge-workspace-store.tsx`
  - `packages/forge/src/components/ForgeWorkspace/store/slices/`
- Yarn converter:
  - `packages/forge/src/lib/yarn-converter/`

