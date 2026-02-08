# Forge Yarn export: goal, next steps, and questions

**Goal:** Generate a **complete Yarn Spinner file** from any narrative/dialogue graph that is meant to produce Yarn, **resolving all referenced graphs** (storylet/detour) so the output is self-contained and valid for any consumer (our graph runner or a Yarn VM). This applies to **any graph intended to produce Yarn Spinner output**.

Context: [README-FORGE-FOCUS.md](README-FORGE-FOCUS.md), [12-yarn-spinner-alignment.md](12-yarn-spinner-alignment.md), [30-plan-yarn-and-graph-types.md](30-plan-yarn-and-graph-types.md), [54-migration-roadmap.md](54-migration-roadmap.md). Data access and export resolution: [55-data-access-and-export.md](55-data-access-and-export.md).

---

## Goal (refined)

1. **Single entry:** Given one “root” graph (e.g. main story or a storylet), run `exportToYarn(graph, context)` with a context that can resolve other graphs (e.g. workspace store with `getGraphFromCache` / `ensureGraph`).
2. **Resolve references:** For every STORYLET and DETOUR node, load the target graph and **inline** its nodes into the same Yarn output (use node ids as stored—no prefix). Track visited graphs to avoid infinite recursion. If a referenced graph does not load, fail the export and warn the user (see [52](52-yarn-spinner-variables-flattening-caveats.md)).
3. **Output:** One contiguous Yarn file (string) containing all nodes from the root graph and from every inlined graph, with correct `<<jump>>` targets and unique node titles. No unresolved references in the emitted text.
4. **Applicable to any graph:** The same pipeline works whether the root is a “narrative” graph (Page/Detour/Jump) or a “dialogue” graph (Character/Player/Conditional/Storylet/Detour), as long as the graph is meant to be exported to Yarn. Narrative nodes are structure-only (we don’t link to Writer pages); Narrative-only export produces a **structural skeleton** with **blank nodes** (no dialogue, no choices). See [52](52-yarn-spinner-variables-flattening-caveats.md).

---

## Export resolution: server-side and preview

**Full export is server-side.** Graph resolution and Yarn export (with storylet/detour inlining) are performed **server-side** so that all referenced graphs can be loaded and inlined. The client can show a **preview** of Yarn without full resolution (e.g. current graph only, or best-effort with placeholders). For **full export**, the client must request export from the server (or provide the full graph set) so the server can resolve referenced graphs and return the complete Yarn string. See [55-data-access-and-export.md](55-data-access-and-export.md).

---

## Next steps (implementation)

Use these to drive slices; update Done/Next in [30-plan-yarn-and-graph-types.md](30-plan-yarn-and-graph-types.md) and related plans as you go.

1. **Graph types (forge-agent)**  
   Extend ForgeGraphDoc / ForgeNode so all node types (CHARACTER, PLAYER, CONDITIONAL, STORYLET, DETOUR, and narrative PAGE, DETOUR, JUMP, END) and fields (conditionalBlocks, storyletCall, defaultNextNodeId, presentation, runtimeDirectives, etc.) match dialogue-forge. Ensure FORGE_NODE_TYPE and handler registry can distinguish them.

2. **Yarn converter core port**  
   Port from dialogue-forge: `exportToYarn`, `importFromYarn`, handler registry, builders (YarnTextBuilder, NodeBlockBuilder), `prepareGraphForYarnExport`, parseYarnContent, determineNodeTypeFromYarn. No edge-drop; only node types we support.

3. **Handlers (one by one)**  
   Port and test: Character, Player, Conditional, Storylet, Detour. Ensure each emits valid Yarn (title, ---, content, options/jumps/set/conditionals, ===). For Storylet/Detour, use context to resolve and inline; use node ids as stored (no prefix). Fail export and warn if referenced graph does not load.

4. **Data access and graph resolution**  
   Use React Query hooks with Payload CMS SDK for graph CRUD (no data adapters). For **full** Yarn export, resolution is **server-side** (see [55](55-data-access-and-export.md)); client may use context for preview only. Ensure `visitedGraphs` is used to break cycles; inlined nodes keep their stored node ids (no prefix). Enforce unique node ids in the editor (graph-scoped or global).

5. **End-to-end “complete Yarn” test**  
   Build a test: root graph + 1–2 referenced graphs (storylet/detour). Export with context. Assert: single string, no placeholder “Could not load graph”, all node titles unique, every `<<jump>>` target exists in the output. Optionally run through a Yarn parser or VM if available to validate syntax.

6. **Variables and flattening in export**  
   Ensure setFlags and conditionals in the graph use variable names that match our flattening (see [51-flag-manager-and-flattening.md](51-flag-manager-and-flattening.md), [52-yarn-spinner-variables-flattening-caveats.md](52-yarn-spinner-variables-flattening-caveats.md)). Emit `<<set $flatKey = value>>`; document or add tests that flat keys match what the flattener produces.

7. **Narrative nodes in export**  
   Act, Chapter, and Page are all page nodes; export contract uses PAGE only (and narrative Detour/Jump). When root is narrative-only, export a **structural skeleton** with **blank nodes** (no dialogue, no choices). Implement narrative handlers to emit skeleton; align with [12](12-yarn-spinner-alignment.md).

8. **Docs and review**  
   Keep [README-FORGE-FOCUS.md](README-FORGE-FOCUS.md), [50-game-state-and-player.md](50-game-state-and-player.md), [51](51-flag-manager-and-flattening.md), [52](52-yarn-spinner-variables-flattening-caveats.md), [54-migration-roadmap.md](54-migration-roadmap.md), and this doc updated. Re-read the forge migration docs when changing export, flattening, or graph resolution.

---

## Open questions (resolved and remaining)

**Resolved (documented in 52 and 12):**

- **Node id when inlining:** No prefix; use node ids as stored. See [52](52-yarn-spinner-variables-flattening-caveats.md).
- **Missing referenced graph:** Fail the whole export and warn the user. See 52.
- **Variable names in graph:** Prefer storing the flat key; if storing schema id, map at export/runner per 51. See 52.
- **Declarations:** Emit `<<declare>>` for schema variables when schema available at export; see 52.
- **Act/Chapter/Page:** All are page nodes; export contract uses PAGE only (and Detour/Jump). See [12](12-yarn-spinner-alignment.md).
- **Narrative graph → Yarn:** Export a **structural skeleton** with **blank nodes** (no dialogue, no choices). Narrative nodes are just the normal graph structure in Yarn form. See 52.

**Remaining:**

- (None currently; add new questions here as they arise.)

---

## Done / Next (to update in 30)

As you complete steps, move them to Done in [30-plan-yarn-and-graph-types.md](30-plan-yarn-and-graph-types.md) and advance the Next list. Keep this file’s “Open questions” in sync so the next agent or human can pick them up.
