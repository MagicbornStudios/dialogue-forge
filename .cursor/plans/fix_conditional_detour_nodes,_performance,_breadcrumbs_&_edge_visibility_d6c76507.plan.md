---
name: Fix Conditional/Detour Nodes, Performance, Breadcrumbs & Edge Visibility
overview: Fix conditional node context menu, add DetourNode fields/context menu, improve edge visibility, add immer middleware for performance, separate breadcrumbs per editor, prevent narrative graphs in storylet editor, and fix Yarn view scrolling.
todos:
  - id: fix-conditional-context-menu
    content: Fix ConditionalNodeV2 'Add Conditional Block' to actually add a block
    status: completed
  - id: verify-conditional-fields-sync
    content: Verify ConditionalNodeFields syncs properly with node updates
    status: pending
  - id: create-detour-fields
    content: Create DetourNodeFields component with storylet graph selector
    status: completed
  - id: add-detour-context-menu
    content: Add context menu to DetourNode with Edit and Delete options
    status: completed
  - id: improve-edge-visibility
    content: Increase edge opacity and stroke width for better visibility
    status: completed
  - id: add-immer-middleware
    content: Add immer middleware to Zustand store for performance optimization
    status: completed
  - id: optimize-node-drag
    content: Optimize onNodesChange to debounce position updates during drag
    status: completed
    dependencies:
      - add-immer-middleware
  - id: separate-breadcrumbs
    content: Separate breadcrumb history per editor scope (narrative vs storylet)
    status: completed
  - id: prevent-cross-scope-graphs
    content: Add validation to prevent narrative graphs in storylet editor and vice versa
    status: completed
    dependencies:
      - separate-breadcrumbs
  - id: fix-yarn-scrolling
    content: Hide scrollbar in Yarn view while maintaining scroll functionality
    status: completed
---

# Fix Conditional/Detour Nodes, Performance, Breadcrumbs & Edge Visibility

## Issues Identified

1. **ConditionalNodeV2 context menu**: "Add Conditional Block" just opens editor instead of adding a block
2. **ConditionalNodeFields**: Fields not syncing properly (similar to PlayerNodeFields issue)
3. **DetourNode**: Missing fields component and context menu
4. **Edge visibility**: Edges still hard to see despite color fixes
5. **Performance**: Node dragging causes lag due to excessive state updates
6. **Breadcrumbs**: Currently shared between editors, should be per editor (narrative vs storylet)
7. **Graph scope isolation**: Narrative graphs should never load in storylet editor
8. **Yarn view**: Needs scrolling but scrollbar should be hidden

## Implementation Plan

### Phase 1: Fix ConditionalNodeV2 Context Menu

**File: `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2.tsx`**

- Fix "Add Conditional Block" menu item to actually add a conditional block using `actions.patchNode`
- Pattern after CharacterNode's "Add Conditionals" implementation
- Add block with proper structure: `{ id, type: IF, condition: [], content: '', speaker: undefined }`

### Phase 2: Verify ConditionalNodeFields Sync

**File: `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeFields.tsx`**

- Verify that `onUpdate` is properly wired to use `actions.patchNode` (should already be working via NodeEditor)
- Ensure conditional blocks added via context menu appear in editor immediately
- Test that adding/removing blocks from editor updates the node correctly

### Phase 3: Add DetourNode Fields and Context Menu

**File: `src/components/GraphEditors/shared/Nodes/DetourNode/DetourNodeFields.tsx` (NEW)**

- Create DetourNodeFields component similar to StoryletNodeFields
- Include fields for: storyletId (graph selector), returnNodeId, title, summary
- Use storylet graph selector from workspace store

**File: `src/components/GraphEditors/shared/Nodes/DetourNode/DetourNode.tsx`**

- Add ContextMenu wrapper (similar to other nodes)
- Add context menu items: Edit Node, Delete (if not start node)
- Wire up double-click to open node editor

**File: `src/components/GraphEditors/shared/NodeEditor/NodeEditor.tsx`**

- Add case for `FORGE_NODE_TYPE.DETOUR` to render DetourNodeFields
- Pass necessary props (graph, onUpdate, etc.)

### Phase 4: Improve Edge Visibility

**File: `src/components/GraphEditors/shared/Edges/ForgeEdge.tsx`**

- Increase default opacity from 0.7 to 0.9 for better visibility
- Increase stroke width from 2 to 3 for default edges
- Ensure dimmed edges are still visible (increase opacity from 0.2 to 0.4)
- Add stronger glow effect on hover

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`**

- Verify edgesWithMeta uses proper stroke colors (already fixed in edgeStrokeColor)
- Ensure opacity values match ForgeEdge component

### Phase 5: Add Immer Middleware for Performance

**File: `package.json`**

- Add `immer` as dependency: `npm install immer`

**File: `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`**

- Import `immer` middleware from zustand
- Wrap store creation with `immer` middleware: `immer(devtools(...))`
- This will optimize state updates and reduce unnecessary re-renders

**File: `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`**

- Optimize `onNodesChange` to debounce position updates during drag
- Only sync positions to graph on drag stop, not during drag
- Use `directUpdateRef` to prevent unnecessary graph updates during simple drags

### Phase 6: Separate Breadcrumbs Per Editor

**File: `src/components/ForgeWorkspace/store/slices/graph.slice.ts`**

- Change `breadcrumbHistory` to `breadcrumbHistoryByScope: Record<"narrative" | "storylet", BreadcrumbItem[]>`
- Update all breadcrumb actions to accept `scope` parameter
- Update `pushBreadcrumb` to push to scope-specific array
- Update `navigateToBreadcrumb` to work with scope

**File: `src/components/ForgeWorkspace/components/GraphBreadcrumbs.tsx`**

- Accept `scope: "narrative" | "storylet"` prop
- Read from `breadcrumbHistoryByScope[scope] `instead of `breadcrumbHistory`
- Update navigation to use scope-specific breadcrumbs

**File: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`**

- Pass `scope="storylet"` to GraphBreadcrumbs

**File: `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`**

- Pass `scope="narrative"` to GraphBreadcrumbs

**File: `src/components/ForgeWorkspace/store/slices/graph.slice.ts`**

- Update `openGraphInScope` to only push breadcrumb to the correct scope
- Ensure narrative graphs never appear in storylet breadcrumbs and vice versa

### Phase 7: Prevent Narrative Graphs in Storylet Editor

**File: `src/components/ForgeWorkspace/store/slices/graph.slice.ts`**

- Add validation in `openGraphInScope` to check graph kind matches scope
- If graph kind doesn't match scope, log warning and don't open
- Ensure `ensureGraph` respects scope boundaries

**File: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`**

- Verify that narrative graph loading doesn't affect storylet editor scope
- Ensure storylet graph loading doesn't affect narrative editor scope

### Phase 8: Fix Yarn View Scrolling

**File: `src/components/GraphEditors/shared/YarnView.tsx`**

- Add custom scrollbar styling to hide scrollbar while allowing scroll
- Use CSS: `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`
- Ensure content area is scrollable with mouse wheel and touch gestures

## Files to Modify

1. `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2.tsx`
2. `src/components/GraphEditors/shared/Nodes/DetourNode/DetourNodeFields.tsx` (NEW)
3. `src/components/GraphEditors/shared/Nodes/DetourNode/DetourNode.tsx`
4. `src/components/GraphEditors/shared/NodeEditor/NodeEditor.tsx`
5. `src/components/GraphEditors/shared/Edges/ForgeEdge.tsx`
6. `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`
7. `package.json`
8. `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`
9. `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`
10. `src/components/ForgeWorkspace/store/slices/graph.slice.ts`
11. `src/components/ForgeWorkspace/components/GraphBreadcrumbs.tsx`
12. `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
13. `src/components/GraphEditors/shared/YarnView.tsx`
14. `src/components/ForgeWorkspace/store/slices/subscriptions.ts`