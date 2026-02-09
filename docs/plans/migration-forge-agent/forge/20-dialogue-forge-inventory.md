# Dialogue-forge inventory (ForgeWorkspace and Yarn)

Inventory of what to migrate from this repo. **Exclude** all edge-drop surface (see [11-out-of-scope.md](../strategy/11-out-of-scope.md)).

**Forge-agent:** Graph CRUD and resolution use **React Query + Payload CMS** (no store/adapter). Full export and ensureGraph-style resolution are **server-side**; see [55-data-access-and-export.md](55-data-access-and-export.md).

## Store

- **packages/forge/src/components/ForgeWorkspace/store/forge-workspace-store.tsx** — Root store.
- **Slices:** graph (graphs.byId, activeNarrativeGraphId, activeStoryletGraphId, breadcrumbHistoryByScope), draft (committedGraph, draftGraph, deltas, validation, hasUncommittedChanges, lastCommittedAt), gameState, viewState, project, subscriptions.
- **Actions:** setGraph, setGraphs, setGraphStatus, removeGraph, setActiveNarrativeGraphId, setActiveStoryletGraphId, ensureGraph, openGraphInScope, pushBreadcrumb, popBreadcrumb, clearBreadcrumbs, navigateToBreadcrumb; draft commit; modal/openYarnModal/closeYarnModal; etc.

## Layout and shell

- ForgeWorkspace.tsx, ForgeDataContext.tsx.
- ForgeWorkspaceLayout, ForgeWorkspaceMenuBar, ForgeWorkspacePanels, ForgeWorkspaceToolbar, ForgeProjectSwitcher, ProjectSync.
- ForgeSideBar: ForgeNarrativeList, StoryletList, NodePalette, InlineRenameInput, SectionHeader, SectionToolbar.
- CommandBar.

## Graph editors

- **ForgeNarrativeGraphEditor** — Nodes: ACT, CHAPTER, PAGE, CONDITIONAL, DETOUR, STORYLET (+ START → ActNode). No CHARACTER/PLAYER.
- **ForgeStoryletGraphEditor** — Nodes: CHARACTER, PLAYER, CONDITIONAL, STORYLET, DETOUR. No Act/Chapter/Page.
- Pane context menus: NarrativeGraphEditorPaneContextMenu, ForgeStoryletGraphEditorPaneContextMenu.
- **Do not migrate:** Any usage of edgeDropMenu, setEdgeDropMenu, *EdgeDropMenu components (see 11-out-of-scope).

## Shared graph editor UI

- CommitBar, ForgeEdge, ForgeGraphBreadcrumbs, GraphEditorStatusBar, GraphEditorToolbar, GraphLayoutControls, GraphLeftToolbar, GraphMiniMap, GraphToolbar, GraphViewModeTabs, GuidePanel, PaneContextMenu, YarnView.
- hooks/useDraftVisualIndicators.

## Node editor (inspector content)

- **NodeEditor** — Wrapper: header, id field, runtime directives, set-flags, next-node selector; body = NodeEditorFields.
- **NodeEditorFields** — Dispatches by node.type to:
  - ActNodeFields, ChapterNodeFields, PageNodeFields (narrative pages list from adapter.listPages)
  - CharacterNodeFields, PlayerNodeFields, ConditionalNodeFields, StoryletNodeFields, DetourNodeFields
- **Per-node field components** (migrate as inspector section content): ActNodeFields, ChapterNodeFields, PageNodeFields, CharacterNodeFields, PlayerNodeFields, ConditionalNodeFields, StoryletNodeFields, DetourNodeFields.
- **Shared node UI:** CharacterSelector, ConditionAutocomplete, ContextMenuBase, EdgeContextMenu, **EdgeDropMenu** (do not migrate), EdgeIcon, EdgeSVGElements, FlagIndicator, FlagSelector, StandardNodeContextMenuItems.

## React Flow nodes (canvas)

- ActNode, ChapterNode, PageNode, CharacterNode, PlayerNode, ConditionalNode, StoryletNode, DetourNode (+ shared components). Use these as reference for forge-agent node components; **omit** any EdgeDropMenu or edge-drop handle logic.

## Modals

- ForgeWorkspaceModals, ForgeYarnModal, ForgeFlagManagerModal (and ForgeFlagManager subcomponents).

## Yarn converter (migrate logic)

- **packages/forge/src/lib/yarn-converter/index.ts** — exportToYarn(graph, context?), importFromYarn(yarnContent, title, context?); handler registry; parseYarnContent; determineNodeTypeFromYarn.
- **types.ts, registry.ts, workspace-context.ts** — createWorkspaceContext(store), createMinimalContext(), getGraphFromCache, ensureGraph, visitedGraphs.
- **builders:** node-block-builder.ts, yarn-text-builder.ts.
- **handlers:** base-handler, character-handler, player-handler, conditional-handler, storylet-handler, detour-handler.
- **utils:** runtime-export (prepareGraphForYarnExport, logRuntimeExportDiagnostics), condition-formatter, condition-parser, content-formatter, variable-handler.

## Graph-editor hooks (no edge-drop)

- useSimpleForgeFlowEditor, useGraphAutoSave, useForgeFlowEditorShell, useForgeEditorActions, useForgeEditorSession, usePaneContextMenu, useFlowPathHighlighting; forge-commands (exclude SET_EDGE_DROP_MENU when porting).
- **Do not port:** useEdgeDropBehavior; any session state or shell API that exposes edgeDropMenu/setEdgeDropMenu.

## Types (source of truth for migration)

- **packages/shared/src/types/forge-graph.ts** — FORGE_GRAPH_KIND, FORGE_NODE_TYPE, NARRATIVE_FORGE_NODE_TYPE, ForgeGraphDoc, ForgeNode, ForgeStoryletCall, ForgeChoice, ForgeConditionalBlock, ForgeReactFlowNode, ForgeReactFlowEdge, ForgeReactFlowJson, etc.
- packages/forge/types re-exports.

## Hooks and utils

- useForgeWorkspaceActions, useNodeDrag, usePanelPersistence; forge-workspace-utils (exportDialogueToYarn).
