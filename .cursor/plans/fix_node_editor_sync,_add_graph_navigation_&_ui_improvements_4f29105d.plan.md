---
name: Fix Node Editor Sync, Add Graph Navigation & UI Improvements
overview: Fix data synchronization issues in NodeEditor, add breadcrumb navigation for storylet graphs, improve edge visibility, integrate Yarn view, and implement resizable panel system for editors.
todos:
  - id: fix-node-editor-sync
    content: Fix NodeEditor to use shell.selectedNode and wire up onUpdate/onDelete callbacks
    status: completed
  - id: fix-conditional-syntax
    content: Fix ConditionalNodeV2 syntax error on line 263
    status: completed
  - id: add-breadcrumb-state
    content: Add breadcrumb history state and actions to graph slice
    status: completed
  - id: create-breadcrumb-component
    content: Create GraphBreadcrumbs component for navigation
    status: completed
    dependencies:
      - add-breadcrumb-state
  - id: add-editor-toolbar
    content: Add toolbar above ReactFlow canvas with breadcrumbs and view toggles
    status: completed
    dependencies:
      - create-breadcrumb-component
  - id: update-storylet-fields
    content: Add storylet graph selector to StoryletNodeFields
    status: completed
  - id: improve-edge-visibility
    content: Fix edge color coding for storylet graph edges
    status: completed
  - id: integrate-yarn-view
    content: Add Yarn view toggle and integration to both graph editors
    status: completed
    dependencies:
      - add-editor-toolbar
  - id: create-resizable-panel
    content: Create ResizablePanel component with dock/undock support
    status: completed
  - id: implement-panel-system
    content: Replace fixed editor divs with resizable panels in ForgeWorkspace
    status: completed
    dependencies:
      - create-resizable-panel
  - id: verify-node-sync
    content: Verify all node types sync data correctly between context menu and editor
    status: completed
    dependencies:
      - fix-node-editor-sync
---

# Fix Node Editor Sync, Add Graph Navigation & UI Improvements

## Issues Identified

1. **NodeEditor data sync**: NodeEditor receives node from `shell.nodes` (React Flow nodes) instead of `shell.selectedNode` (properly memoized ForgeNode)
2. **NodeEditor callbacks**: `onUpdate` and `onDelete` are empty functions, preventing updates/deletes
3. **Storylet graph navigation**: No breadcrumbs to navigate between graphs when opening storylet graphs
4. **Storylet node fields**: Cannot select storylet graph from sidebar in StoryletNodeFields
5. **Edge visibility**: Storylet graph edges are all gray, need better color coding
6. **Yarn view**: Not integrated into editors
7. **Editor UI**: Need toolbar outside ReactFlow canvas for breadcrumbs and controls
8. **Resizable panels**: Editors should be resizable/dockable panels
9. **ConditionalNodeV2 syntax error**: Line 263 has invalid `actions.(node.id)`

## Implementation Plan

### Phase 1: Fix NodeEditor Data Synchronization

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`**

- Fix NodeEditor node prop: Use `shell.selectedNode` instead of `shell.nodes.find()`
- Wire up `onUpdate` to use `actions.patchNode`
- Wire up `onDelete` to use `actions.deleteNode`
- Ensure NodeEditor re-renders when graph updates by using `shell.selectedNode` (already memoized)

**File: `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`**

- Update `handleUpdateNode` to include `choices` and `conditionalBlocks` in the "simple update" check, or ensure they trigger proper graph updates
- Verify that `selectedNode` memoization includes all node fields (choices, conditionalBlocks)

### Phase 2: Fix ConditionalNodeV2 Syntax Error

**File: `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2.tsx`**

- Fix line 263: Replace `actions.(node.id)` with proper action call (likely `actions.openNodeEditor(node.id)` or remove if not needed)
- Add missing import for `Copy` icon if needed

### Phase 3: Add Breadcrumb Navigation System

**File: `src/components/ForgeWorkspace/store/slices/graph.slice.ts`**

- Add `breadcrumbHistory: Array<{ graphId: string; title: string; scope: 'narrative' | 'storylet' }>` to state
- Add actions: `pushBreadcrumb`, `popBreadcrumb`, `clearBreadcrumbs`, `navigateToBreadcrumb(index)`
- Update `openGraphInScope` to push breadcrumb when opening a new graph

**File: `src/components/ForgeWorkspace/components/GraphBreadcrumbs.tsx` (NEW)**

- Create breadcrumb component showing navigation history
- Each breadcrumb clickable to navigate back
- Show graph title and type (narrative/storylet)
- Truncate long breadcrumb chains with "..." if needed

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`**

- Add toolbar above ReactFlow canvas
- Include GraphBreadcrumbs component
- Add view mode toggle (Graph/Yarn/Play) if not already present

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNodeFields.tsx`**

- Add storylet graph selector using StoryletsSidebar data
- Allow selecting a storylet graph from dropdown/list
- Update `targetGraphId` when selection changes

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNode.tsx`**

- Update context menu "Open Storylet Graph" to push breadcrumb before opening

### Phase 4: Improve Edge Visibility

**File: `src/components/GraphEditors/utils/forge-edge-styles.ts` (or similar)**

- Review `edgeColorFor` function to ensure storylet graph edges get proper colors
- Add color coding for different edge types (choice edges, default edges, conditional edges)
- Ensure storylet graph edges use same color scheme as narrative graph edges

**File: `src/components/GraphEditors/shared/Edges/ForgeEdge.tsx`**

- Verify edge colors are being applied correctly
- Check that `baseColor` from `edgeColorFor` is used properly
- Ensure opacity and stroke width are appropriate for visibility

### Phase 5: Integrate Yarn View

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`**

- Add view mode state: `'graph' | 'yarn' | 'play'`
- Add toolbar button to toggle between Graph/Yarn/Play views
- Conditionally render YarnView component when view mode is 'yarn'
- Pass current graph to YarnView and handle onChange to update graph

**File: `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`**

- Same Yarn view integration as storylet editor

### Phase 6: Implement Resizable Panel System

**File: `src/components/ForgeWorkspace/components/ResizablePanel.tsx` (NEW)**

- Create resizable panel component using `react-resizable-panels` or similar
- Support vertical and horizontal resizing
- Support dock/undock (fullscreen) mode
- Store panel state in workspace store or local state

**File: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`**

- Replace fixed height divs with ResizablePanel components
- Make narrative and storylet editors resizable panels
- Add panel controls (dock/undock, resize handles)

**File: `src/components/ForgeWorkspace/store/slices/viewState.slice.ts`**

- Add panel state: `{ narrativeEditor: { isDocked: boolean, size: number }, storyletEditor: { isDocked: boolean, size: number } }`
- Add actions to update panel state

### Phase 7: Verify All Node Types Work Correctly

**Files: All NodeFields components**

- Verify PlayerNodeFields, ConditionalNodeFields, CharacterNodeFields all use `actions.patchNode` correctly
- Ensure all node updates trigger proper re-renders
- Test adding/removing choices, conditional blocks, etc. from both context menu and node editor

## Testing Checklist

- [ ] NodeEditor shows updated choices after adding from context menu
- [ ] NodeEditor shows updated conditional blocks after adding from context menu
- [ ] NodeEditor can update and delete nodes
- [ ] Breadcrumbs appear when opening storylet graphs
- [ ] Breadcrumbs allow navigation back to previous graphs
- [ ] StoryletNodeFields allows selecting storylet graph from sidebar
- [ ] Storylet graph edges are visible with proper colors
- [ ] Yarn view shows correct Yarn output for current graph
- [ ] Editors can be resized and docked/undocked
- [ ] All node types (Player, Character, Conditional, Storylet) sync data correctly

## Files to Modify

1. `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`
2. `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2.tsx`
3. `src/components/ForgeWorkspace/store/slices/graph.slice.ts`
4. `src/components/ForgeWorkspace/components/GraphBreadcrumbs.tsx` (NEW)
5. `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNodeFields.tsx`
6. `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNode.tsx`
7. `src/components/GraphEditors/utils/forge-edge-styles.ts`
8. `src/components/GraphEditors/shared/Edges/ForgeEdge.tsx`
9. `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
10. `src/components/ForgeWorkspace/components/ResizablePanel.tsx` (NEW)
11. `src/components/ForgeWorkspace/ForgeWorkspace.tsx`
12. `src/components/ForgeWorkspace/store/slices/viewState.slice.ts`
13. `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`