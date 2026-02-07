# Forge workspace walkthrough

Step-by-step view of the Forge workspace for reimplementation. For architecture and Yarn pipeline, see [../architecture/dialogue-domain-and-yarn.md](../architecture/dialogue-domain-and-yarn.md).

## What Forge is

Forge is the visual, node-based dialogue editor. It has two graph editors: **narrative** (acts/chapters/pages, storylet/detour calls) and **storylet** (character lines, player choices, conditionals). Both share a workspace store, draft per scope, and Yarn export.

## Layout

- **Menu bar** — Top; workspace-level actions.
- **Sidebar** — Two lists: **Narratives** (narrative graphs) and **Storylets** (storylet graphs). Search, create, rename, delete. Selection drives which graph is shown in the editor.
- **Node palette** — Add nodes (Act, Chapter, Page, Character, Player, Conditional, Detour, Storylet). Allowed node types differ by editor: narrative = Act, Chapter, Page, Conditional, Detour, Storylet; storylet = Character, Player, Conditional, Storylet, Detour.
- **Graph editor panel** — React Flow canvas. Either narrative or storylet editor depending on scope. Breadcrumbs when drilling into graphs. Left toolbar (layout, minimap, path highlighting, etc.), graph toolbar (Yarn view, etc.).
- **Node editor panel** — When a node is selected, shows node-specific fields (content, choices, conditions, storylet call, flags, etc.). Uses shared NodeEditor + per-type fields (CharacterNodeFields, PlayerNodeFields, etc.).
- **Modals** — Yarn view (export/view single graph), Flag manager, Guide.

## Typical flow

1. **Open Forge** — Workspace mounts with project from host. Subscriptions load narrative and storylet graphs for the project; active IDs set if none.
2. **Pick a narrative or storylet** — Click a narrative or storylet in the sidebar. That graph becomes the active one for that scope; the corresponding editor shows it.
3. **Add nodes** — Drag from node palette onto canvas, or use pane context menu. Narrative editor: add Act/Chapter/Page, link them; add Storylet/Detour nodes that reference another graph by ID. Storylet editor: add Character/Player/Conditional/Storylet/Detour.
4. **Edit a node** — Select node; node editor shows. Edit content, choices, conditions, storylet call (target graph, start node, return node for detour), set flags, runtime directives.
5. **View Yarn** — Open Yarn modal (toolbar). Shows export of the **current** graph only (narrative or storylet by focus). Single-graph export; storylet/detour refs to other graphs do not resolve unless export is called with workspace context (see architecture doc).
6. **Manage flags** — Open Flag manager modal; manage flag schema and game state (if wired).
7. **Save** — Draft is committed via adapter (createPage for new Act/Chapter/Page, updateGraph for flow). Autosave/debounce is wired in the graph editor shell.

## Key entry points

- **Shell:** `packages/forge/src/components/ForgeWorkspace/ForgeWorkspace.tsx`
- **Sidebar:** ForgeNarrativeList, StoryletList, NodePalette under `components/ForgeSideBar/`
- **Editors:** ForgeNarrativeGraphEditor, ForgeStoryletGraphEditor under `components/GraphEditors/`
- **Node editor:** `components/GraphEditors/shared/NodeEditor/`
- **Yarn modal:** ForgeYarnModal; YarnView calls `exportToYarn(graph)` (no context)
- **Store:** forge-workspace-store; slices: graph, draft, gameState, viewState, project, subscriptions

## Links

- [Dialogue domain and Yarn](../architecture/dialogue-domain-and-yarn.md) — Graph kinds, node types, storylets/detours, Yarn pipeline, file inventory.
- [Workspace editor architecture](../architecture/workspace-editor-architecture.md) — Store, session, shell, commands, no draft slices, no event bus.
