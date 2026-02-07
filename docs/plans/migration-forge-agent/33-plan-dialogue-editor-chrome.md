# Plan: Dialogue editor chrome

Dialogue editor UI chrome: dual panels, node palette, breadcrumbs, toolbar, Yarn view, flag manager. No edge-drop.

## Steps

### 1. Dual narrative / storylet panels

- Forge-agent already has dual narrative/storylet panels in DialogueEditor. Verify they match dialogue-forge behavior: separate graph lists (narratives vs storylets), active narrative graph id and active storylet graph id, breadcrumbs when drilling. Port any missing behavior (e.g. breadcrumb navigation, openGraphInScope).

### 2. Node palette

- Node palette: list of node types the user can add. Drag from palette onto canvas to create node (or click to add at default position). **Do not implement edge-drop:** no “drag from handle → open menu to choose target.” Use standard React Flow connect (handle-to-handle) or a single “Connect” action in the inspector that lets user pick target.
- Narrative palette: Act, Chapter, Page, Conditional, Detour, Storylet. Storylet palette: Character, Player, Conditional, Storylet, Detour. Restrict by current panel (narrative vs storylet).

### 3. Breadcrumbs, toolbar, Yarn view modal

- Breadcrumbs: when user has drilled into a graph (e.g. via storylet node), show breadcrumb trail and allow navigating back. Port ForgeGraphBreadcrumbs behavior.
- Toolbar: project switcher, view menu, Yarn button (opens Yarn view/modal). Port relevant items from ForgeWorkspaceToolbar / GraphEditorToolbar.
- Yarn view modal: shows export of current graph (narrative or storylet). Call exportToYarn(graph, createWorkspaceContext(store)) so storylet/detour refs resolve. Download .yarn option. Optional: import .yarn and replace graph (importFromYarn then applyOperations/commit).

### 4. Flag manager

- If forge-agent already has a flag/schema manager, align with dialogue-forge’s ForgeFlagManager (flag schema CRUD, game state per project). If not in scope, document as follow-up. Port only if product requires it for Phase 1.

## Done

- (None yet.)

## Next

1. Verify dual panels and breadcrumbs (slice 1).
2. Implement node palette (no edge-drop) and restrict by narrative vs storylet (slice 2).
3. Add Yarn button and modal with exportToYarn(graph, context) and download (slice 3).
4. Port breadcrumb navigation and toolbar items as needed (slice 4).
5. Flag manager: document or implement per product (slice 5).
