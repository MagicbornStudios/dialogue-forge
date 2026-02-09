# Plan: Yarn and graph types

Migrate the Yarn pipeline and extend forge-agent graph types so dialogue logic and export/import work in the new codebase.

## Dependencies

- Graph types must be extended first so ForgeNode and handlers have the right shape.

## Steps

### 1. Extend @forge/types/graph (forge-agent)

- **Narrative graph** node set: PAGE, DETOUR, JUMP (plus END if used). No separate Act/Chapter/Page node types — just one “page” node type for the narrative graph.
- **Dialogue editor (ForgeWorkspace)** node set: Character, Player, Conditional, Storylet, Detour (and any shared types). These live in the dialogue editor in the new codebase.
- Add to FORGE_NODE_TYPE: PAGE, STORYLET, DETOUR, JUMP, END (and any shared types). Extend ForgeNode: conditionalBlocks (ForgeConditionalBlock[]), storyletCall (ForgeStoryletCall), defaultNextNodeId, presentation, runtimeDirectives. Match packages/shared/src/types/forge-graph.ts in dialogue-forge. No actId/chapterId/pageId on narrative “page” nodes unless repurposed as a single page reference.
- Add ForgeStoryletCall (mode, targetGraphId, targetStartNodeId?, returnNodeId?, returnGraphId?), ForgeConditionalBlock, ForgeChoice (with conditions?). NARRATIVE_FORGE_NODE_TYPE if needed (PAGE, DETOUR, JUMP, END).
- Ensure ForgeGraphDoc has startNodeId, endNodeIds (array of { nodeId, exitKey? }), flow.viewport.

### 2. Port yarn-converter (forge-agent)

- Copy/adapt from packages/forge/src/lib/yarn-converter/:
  - index.ts: exportToYarn(graph, context?), importFromYarn(yarnContent, title, context?), handler registry, parseYarnContent, determineNodeTypeFromYarn.
  - types.ts, registry.ts, workspace-context.ts (createWorkspaceContext from editor/store, createMinimalContext).
  - builders: node-block-builder.ts, yarn-text-builder.ts.
  - handlers: base-handler, character-handler, player-handler, conditional-handler, storylet-handler, detour-handler.
  - utils: runtime-export (prepareGraphForYarnExport, logRuntimeExportDiagnostics), condition-formatter, condition-parser, content-formatter, variable-handler.
- Do not port any edge-drop logic. Ensure handler registry only uses node types we support.
- In forge-agent, **graph data** is loaded via **React Query hooks** that call the **Payload CMS SDK** (no data adapters). Full **export resolution** (loading referenced graphs for storylet/detour inlining) is **server-side**; the server uses Payload to load graphs and produce complete Yarn. See [55-data-access-and-export.md](55-data-access-and-export.md).

### 3. exportToYarn(graph, context?) and importFromYarn

- Export: already described in step 2; call from Yarn view/modal with context when available so storylet/detour inlining works.
- Import: parse .yarn into node blocks; determineNodeTypeFromYarn; call handler.importNode; build ForgeGraphDoc (id 0, project 0, kind STORYLET default, title, startNodeId, endNodeIds [], flow { nodes, edges, viewport }).
- Document in forge-agent: client can show a **preview** of Yarn (e.g. current graph only); **full export** (with storylet/detour resolution) is requested from the server, which loads all referenced graphs via Payload and returns the complete Yarn string.

### 4. Tests (optional but recommended)

- Port or re-create yarn-converter tests (round-trip, storylet-handler, detour-handler, etc.) in forge-agent so regressions are caught.

## Done

- (None yet; update after each slice.)

## Next

1. Extend @forge/types/graph with full ForgeNode and node types (slice 1).
2. Port yarn-converter core (registry, builders, runtime-export) (slice 2).
3. Port handlers one by one (character, player, conditional, storylet, detour) (slices 3–7).
4. Add createWorkspaceContext(store) and wire in DialogueEditor (slice 8).
5. Add Yarn view/modal that calls exportToYarn with context (slice 9).
