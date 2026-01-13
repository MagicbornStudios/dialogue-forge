---
name: Stabilize Paradigm - Workspace Navigation & Default Graphs
overview: Refactor the workspace to cleanly separate editor actions from workspace navigation, replace graph objects with active IDs, add default graph creation, and remove GraphSection components in favor of direct editor rendering.
todos:
  - id: phase1-graph-slice
    content: "Refactor graph slice: replace narrativeGraph/storyletGraph objects with activeNarrativeGraphId/activeStoryletGraphId, remove storyletGraphs, add openGraphInScope action"
    status: completed
  - id: phase2-default-graphs
    content: Create forge-graph-helpers.ts with createEmptyForgeGraphDoc utility, initialize default graphs in ForgeWorkspace when none exist
    status: completed
  - id: phase3-workspace-actions
    content: Create useForgeWorkspaceActions hook with openStoryletGraph/openNarrativeGraph methods
    status: completed
    dependencies:
      - phase1-graph-slice
  - id: phase4-focus-system
    content: Add pendingFocusByScope to viewState slice, implement requestFocus/clearFocus, consume focus requests in editors
    status: completed
    dependencies:
      - phase1-graph-slice
  - id: phase8-selectors
    content: Update ForgeWorkspaceInner to use proper selectors for active graph IDs and derive graphs from cache
    status: completed
    dependencies:
      - phase1-graph-slice
  - id: phase5-remove-sections
    content: Remove NarrativeGraphSection and StoryletGraphSection, render editors directly in ForgeWorkspaceInner
    status: completed
    dependencies:
      - phase8-selectors
  - id: phase6-storylet-node
    content: Update StoryletNode context menu and StoryletNodeFields to use workspace actions instead of editor actions
    status: completed
    dependencies:
      - phase3-workspace-actions
  - id: phase7-sidebar
    content: Refactor StoryletsSidebar to be store-driven, use workspace actions, add shadcn ContextMenu
    status: pending
    dependencies:
      - phase3-workspace-actions
      - phase8-selectors
  - id: phase9-cleanup
    content: Remove any openGraph references from ForgeEditorActions, ensure clean separation
    status: pending
    dependencies:
      - phase6-storylet-node
  - id: phase10-initialization
    content: Update ForgeWorkspace initialization to handle initial graph IDs and default graph creation
    status: pending
    dependencies:
      - phase2-default-graphs
      - phase1-graph-slice
---

# Stabilize Paradigm - Workspace Navigation & Default Graphs

## Architecture Overview

This plan establishes clear boundaries between:

- **Editor**: Owns rendering/editing one `ForgeGraphDoc`, UI state (selection, menus), emits `onChange(graph)`
- **Workspace**: Owns active graph IDs, graph cache, loading, persistence, navigation
- **NodeEditor/NodeFields**: Owns editing node data (choices/conditions), writes via `onUpdate`
- **UI Components**: Request graph swaps via workspace navigation actions

## Phase 1: Graph Slice Refactor (Active IDs)

### 1.1 Update Graph Slice Structure

**File**: `src/components/ForgeWorkspace/store/slices/graph.slice.ts`

- Remove `narrativeGraph: ForgeGraphDoc | null` and `storyletGraph: ForgeGraphDoc | null`
- Remove `storyletGraphs: Record<string, ForgeGraphDoc> | null` (UI concern, not state)
- Add `activeNarrativeGraphId: string | null`
- Add `activeStoryletGraphId: string | null`
- Update `GraphSlice` interface accordingly

### 1.2 Update Graph Actions

- Remove `setNarrativeGraph` and `setStoryletGraph`
- Add `setActiveNarrativeGraphId(id: string | null)`
- Add `setActiveStoryletGraphId(id: string | null)`
- Update `ensureGraph` to NOT automatically set active graph (decouple loading from activation)
- Add `openGraphInScope(scope: "narrative" | "storylet", graphId: string, opts?: { focusNodeId?: string })` that:
  - Sets active graph ID
  - Calls `ensureGraph(graphId, scope)`
  - Optionally requests focus (see Phase 4)

### 1.3 Update Workspace Store

**File**: `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`

- Update `ForgeWorkspaceState` to use active IDs instead of graph objects
- Remove `narrativeGraph`/`storyletGraph` from state interface
- Update `CreateForgeWorkspaceStoreOptions` to accept `initialNarrativeGraphId` and `initialStoryletGraphId` (strings) instead of graph objects
- Update store creation to initialize active IDs from provided graphs

## Phase 2: Default Graph Creation Utility

### 2.1 Create Empty Graph Helper

**File**: `src/utils/forge-graph-helpers.ts` (new file)

Create utility functions:

- `createEmptyForgeGraphDoc(opts: { projectId: number, kind: ForgeGraphKind, title?: string }): ForgeGraphDoc`
  - Creates minimal valid graph with:
    - Empty flow (nodes: [], edges: [])
    - Generated start node ID (e.g., `start_${Date.now()}`)
    - Empty endNodeIds array
    - Default title based on kind if not provided

### 2.2 Initialize Default Graphs in Workspace

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

- In `ForgeWorkspaceInner`, check if `activeNarrativeGraphId` and `activeStoryletGraphId` are null
- If null and `dataAdapter` is provided, create default graphs via `dataAdapter.createGraph()`
- Set active IDs after creation
- This ensures editors always have a graph to work with

## Phase 3: Workspace Navigation API

### 3.1 Create Workspace Actions Hook

**File**: `src/components/ForgeWorkspace/hooks/useForgeWorkspaceActions.tsx` (new file)

```typescript
export function useForgeWorkspaceActions() {
  const store = useForgeWorkspaceStore();
  
  return {
    openStoryletGraph: (graphId: string, opts?: { focusNodeId?: string }) => {
      store.getState().actions.openGraphInScope("storylet", graphId, opts);
    },
    openNarrativeGraph: (graphId: string, opts?: { focusNodeId?: string }) => {
      store.getState().actions.openGraphInScope("narrative", graphId, opts);
    },
  };
}
```

### 3.2 Update Graph Slice with `openGraphInScope`

**File**: `src/components/ForgeWorkspace/store/slices/graph.slice.ts`

- Implement `openGraphInScope` action that:
  - Sets active graph ID for the scope
  - Calls `ensureGraph(graphId, scope)`
  - If `focusNodeId` provided, calls viewState action to request focus (Phase 4)

## Phase 4: Focus Request System

### 4.1 Update ViewState Slice

**File**: `src/components/ForgeWorkspace/store/slices/viewState.slice.ts`

- Add `pendingFocusByScope: { narrative?: { graphId: string, nodeId?: string }, storylet?: { graphId: string, nodeId?: string } }`
- Add `requestFocus(scope: "narrative" | "storylet", graphId: string, nodeId?: string)`
- Add `clearFocus(scope: "narrative" | "storylet")`

### 4.2 Editor Focus Consumption

**Files**:

- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`

- Read `pendingFocusByScope.storylet` (or `.narrative`) from workspace store
- In `useEffect`, if focus request matches current `graph.id`:
  - Call `reactFlow.fitView({ nodes: [{id: nodeId}] }) `or `setCenter`
  - Call `clearFocus(scope)`

## Phase 5: Remove GraphSection Components

### 5.1 Update ForgeWorkspaceInner

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

- Remove `NarrativeGraphSection` and `StoryletGraphSection` imports
- Replace with direct editor rendering:
  - Derive `narrativeGraph` from `activeNarrativeGraphId` via selector: `useForgeWorkspaceStore(s => narrativeGraphId ? s.graphs.byId[narrativeGraphId] : null)`
  - Similarly for `storyletGraph`
  - Render `ForgeNarrativeGraphEditor` and `ForgeStoryletGraphEditor` directly
  - View mode switching should be handled inside editors (already in session store)

### 5.2 Delete GraphSection Files

- Delete `src/components/ForgeWorkspace/components/NarrativeGraphSection.tsx`
- Delete `src/components/ForgeWorkspace/components/StoryletGraphSection.tsx`

## Phase 6: Update StoryletNode and StoryletNodeFields

### 6.1 StoryletNode Context Menu

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNode.tsx`

- Remove `actions.openGraph` call
- Import `useForgeWorkspaceActions`
- Call `openStoryletGraph(String(graphId), { focusNodeId: node.storyletCall?.targetStartNodeId })`

### 6.2 StoryletNodeFields "Open" Button

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNodeFields.tsx`

- Add "Open Storylet Graph" button (if `targetGraphId` exists)
- Import `useForgeWorkspaceActions`
- On click: `openStoryletGraph(String(targetGraphId), { focusNodeId: node.storyletCall?.targetStartNodeId })`

## Phase 7: Refactor StoryletsSidebar

### 7.1 Make Sidebar Store-Driven

**File**: `src/components/ForgeWorkspace/components/StoryletsSidebar.tsx`

- Remove prop callbacks (`onSelect`, `onOpen`, `onEdit`, `onAdd`)
- Read storylet list from workspace store (need new slice or derive from `graphs.byId` filtered by kind)
- Read `activeStoryletGraphId` from workspace store for selection
- Use `useForgeWorkspaceActions` for `openStoryletGraph`
- Use shadcn `ContextMenu` component for right-click menu
- For `onAdd`, dispatch workspace action to create new graph (or emit event for host app)

### 7.2 Storylet List Management

**Decision needed**: Where should storylet list come from?

- Option A: Filter `graphs.byId` by `kind === "STORYLET"` (derived selector)
- Option B: New `storyletList` slice that maintains list of storylet metadata (id, title, graphId)
- **Recommendation**: Option A for now (simpler), can add slice later if needed

## Phase 8: Update ForgeWorkspaceInner Selectors

### 8.1 Fix Graph Access

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

- Remove `(s as any).graphs?.narrative` and `(s as any).graphs?.storylet` casts
- Use proper selectors:
  ```typescript
  const activeNarrativeGraphId = useForgeWorkspaceStore(s => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore(s => s.activeStoryletGraphId);
  const narrativeGraph = useForgeWorkspaceStore(s => 
    activeNarrativeGraphId ? s.graphs.byId[activeNarrativeGraphId] : null
  );
  const storyletGraph = useForgeWorkspaceStore(s => 
    activeStoryletGraphId ? s.graphs.byId[activeStoryletGraphId] : null
  );
  ```


## Phase 9: Clean Up Editor Actions

### 9.1 Remove openGraph from Editor Actions

**File**: `src/components/GraphEditors/hooks/useForgeEditorActions.tsx`

- Remove any `openGraph` method (if it exists)
- Ensure `ForgeEditorActions` only contains graph mutation and UI selection commands

## Phase 10: Update Initialization

### 10.1 Handle Initial Graph Loading

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

- If `initialNarrativeGraph` prop provided, extract ID and set as `initialNarrativeGraphId`
- If `initialStoryletGraph` prop provided, extract ID and set as `initialStoryletGraphId`
- If no initial graphs and `dataAdapter` provided, create defaults (Phase 2)

## Implementation Order

1. **Phase 1**: Graph slice refactor (foundation)
2. **Phase 2**: Default graph creation utility
3. **Phase 3**: Workspace navigation API
4. **Phase 4**: Focus request system
5. **Phase 8**: Update ForgeWorkspaceInner selectors
6. **Phase 5**: Remove GraphSection components
7. **Phase 6**: Update StoryletNode/Fields
8. **Phase 7**: Refactor StoryletsSidebar
9. **Phase 9**: Clean up editor actions
10. **Phase 10**: Update initialization

## Key Principles

- **Editor actions** = mutate current graph or editor UI state
- **Workspace actions** = navigation (open graph, set active IDs)
- **Focus requests** = one-way signals from workspace → editor
- **Default graphs** = created automatically if none exist
- **Active IDs** = source of truth for which graph is active, not graph objects