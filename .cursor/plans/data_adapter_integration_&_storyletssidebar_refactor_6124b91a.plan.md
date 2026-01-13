---
name: Data Adapter Integration & StoryletsSidebar Refactor
overview: Integrate the data adapter with cache-first graph loading using subscriptions for reactive side effects, wire project selection to load graphs, and refactor StoryletsSidebar to be store-driven. Prioritizes clarity, maintainability, and scalability.
todos:
  - id: phase1-store-adapter
    content: Add dataAdapter to workspace store state and expose via selector
    status: completed
  - id: phase1-resolver
    content: Create cache-first graph resolver function that checks cache then uses dataAdapter
    status: completed
    dependencies:
      - phase1-store-adapter
  - id: phase2-project-slice
    content: Create project.slice.ts with selectedProjectId state and setSelectedProjectId action
    status: completed
  - id: phase2-wire-selection
    content: Wire project selection from page.tsx to workspace store
    status: completed
    dependencies:
      - phase2-project-slice
  - id: phase2-subscription
    content: Add subscription in subscriptions.ts to load project graphs when selectedProjectId changes
    status: completed
    dependencies:
      - phase1-resolver
      - phase2-project-slice
  - id: phase3-sidebar-store
    content: Refactor StoryletsSidebar to read from store, remove prop callbacks, use workspace actions
    status: completed
    dependencies:
      - phase2-subscription
  - id: phase3-sidebar-contextmenu
    content: Add shadcn ContextMenu to StoryletsSidebar entries with Open/Edit/Delete actions
    status: completed
    dependencies:
      - phase3-sidebar-store
  - id: phase3-sidebar-create
    content: Add storylet creation functionality using dataAdapter.createGraph and workspace actions
    status: completed
    dependencies:
      - phase3-sidebar-store
  - id: phase4-auto-select
    content: Add subscription to auto-select first project on mount if none selected
    status: completed
    dependencies:
      - phase2-subscription
  - id: phase4-empty-states
    content: Verify and improve empty state messages in ForgeWorkspace
    status: completed
    dependencies:
      - phase3-sidebar-create
---

# Data Adapter Integration & StoryletsSidebar Refactor

## Architecture Decision: Subscriptions vs useEffect

**Why Subscriptions?**

- **Centralized Logic**: All reactive side effects live in one place (`subscriptions.ts`)
- **Easy to Understand**: Clear pattern - "when X changes, do Y"
- **Testable**: Can test subscriptions independently
- **Scalable**: Easy to add more reactive behaviors following the same pattern
- **No Component Coupling**: Logic doesn't live in React components, making it reusable

**Why Not useEffect?**

- Logic would be scattered across components
- Harder to test and reason about
- More coupling between components and data flow

## Phase 1: Store DataAdapter & Create Cache-First Resolver

### 1.1 Add DataAdapter to Workspace Store

**File**: `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`

**Why**: The dataAdapter needs to be accessible to the resolver and subscriptions. Storing it in the workspace store keeps it in the same domain as graph management.

**Changes**:

- Add `dataAdapter?: ForgeDataAdapter` to `ForgeWorkspaceState` interface
- Store it when creating the store (from `CreateForgeWorkspaceStoreOptions`)
- Expose via selector: `useForgeWorkspaceStore(s => s.dataAdapter)`

**Implementation**:

```typescript
export interface ForgeWorkspaceState {
  // ... existing state
  dataAdapter?: ForgeDataAdapter
}

export interface CreateForgeWorkspaceStoreOptions {
  // ... existing options
  dataAdapter?: ForgeDataAdapter
}

// In createForgeWorkspaceStore:
return {
  ...graphSlice,
  ...gameStateSlice,
  ...viewStateSlice,
  dataAdapter, // Store it
  // ... rest
}
```

### 1.2 Create Cache-First Graph Resolver

**File**: `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`

**Why**: This resolver encapsulates the "check cache first, then adapter" pattern. It's reusable and keeps the logic in one place.

**Implementation**:

```typescript
function createGraphResolver(
  store: ForgeWorkspaceStore,
  dataAdapter?: ForgeDataAdapter
): (id: string) => Promise<ForgeGraphDoc> {
  return async (graphId: string): Promise<ForgeGraphDoc> => {
    const state = store.getState()
    
    // 1. Check cache first
    if (state.graphs.byId[graphId] && state.graphs.statusById[graphId] === "ready") {
      return state.graphs.byId[graphId]
    }
    
    // 2. If not in cache and adapter available, fetch via adapter
    if (!dataAdapter) {
      throw new Error(`No dataAdapter available and graph ${graphId} not in cache`)
    }
    
    // 3. Fetch from adapter (graphId is string, adapter expects number)
    const graph = await dataAdapter.getGraph(Number(graphId))
    
    // 4. Store in cache (this will also emit events via setGraphWithEvents)
    state.actions.setGraph(graphId, graph)
    
    return graph
  }
}
```

**Usage**: Pass this resolver to `createGraphSlice` instead of a raw resolver.

## Phase 2: Add Project State & Wire Selection

### 2.1 Add Project Slice

**File**: `src/components/ForgeWorkspace/store/slices/project.slice.ts` (new file)

**Why**: Projects are a separate domain concern from graphs. A slice keeps it organized and follows the existing pattern.

**Implementation**:

```typescript
export interface ProjectSlice {
  selectedProjectId: number | null
}

export interface ProjectActions {
  setSelectedProjectId: (id: number | null) => void
}

export function createProjectSlice(
  set: StateCreator<ForgeWorkspaceState>[0],
  get: StateCreator<ForgeWorkspaceState>[1]
): ProjectSlice & ProjectActions {
  return {
    selectedProjectId: null,
    setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  }
}
```

**Integration**: Add to `ForgeWorkspaceState` and compose in `createForgeWorkspaceStore`.

### 2.2 Wire Project Selection from Page

**File**: `app/(forge-app)/page.tsx`

**Why**: The page component owns the project selection state. We need to sync it with the workspace store.

**Implementation**:

- Use `useEffect` to sync `selectedProjectId` state to workspace store
- Call `useForgeWorkspaceStore(s => s.actions.setSelectedProjectId)` when `selectedProjectId` changes

**Alternative**: Could also pass `selectedProjectId` as prop to `ForgeWorkspace` and handle sync there. Both are fine, but prop is simpler.

### 2.3 Subscription: Load Project Graphs

**File**: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`

**Why**: This is the perfect use case for subscriptions - reactive side effects based on state changes. It's centralized, easy to understand, and follows the existing pattern.

**Implementation**:

```typescript
export function setupForgeWorkspaceSubscriptions(
  domainStore: ForgeWorkspaceStore,
  uiStore: ForgeUIStore,
  eventSink: EventSink,
  dataAdapter?: ForgeDataAdapter
) {
  if (!dataAdapter) return

  // Subscribe to selectedProjectId changes
  let previousProjectId: number | null = null
  
  domainStore.subscribe(
    (state) => state.selectedProjectId,
    async (selectedProjectId) => {
      // Skip if project didn't actually change
      if (selectedProjectId === previousProjectId) return
      previousProjectId = selectedProjectId
      
      if (!selectedProjectId) {
        // Clear active graphs when no project selected
        domainStore.getState().actions.setActiveNarrativeGraphId(null)
        domainStore.getState().actions.setActiveStoryletGraphId(null)
        return
      }
      
      try {
        // 1. Load project to get narrative graph ID
        const project = await dataAdapter.getProject(selectedProjectId)
        
        // 2. Load narrative graph if it exists
        if (project.narrativeGraph) {
          await domainStore.getState().actions.openGraphInScope(
            'narrative',
            String(project.narrativeGraph)
          )
        }
        
        // 3. Load all storylet graphs for this project into cache
        const storyletGraphs = await dataAdapter.listGraphs(selectedProjectId, 'STORYLET')
        for (const graph of storyletGraphs) {
          domainStore.getState().actions.setGraph(String(graph.id), graph)
        }
        
        // 4. Set first storylet as active if none selected
        const state = domainStore.getState()
        if (storyletGraphs.length > 0 && !state.activeStoryletGraphId) {
          domainStore.getState().actions.setActiveStoryletGraphId(String(storyletGraphs[0].id))
        }
      } catch (error) {
        console.error('Failed to load project graphs:', error)
      }
    },
    { equalityFn: (a, b) => a === b }
  )
}
```

**Key Points**:

- Uses Zustand's `subscribe` API for reactive updates
- Checks cache first (via `openGraphInScope` → `ensureGraph`)
- Loads all storylet graphs into cache for sidebar
- Handles errors gracefully

## Phase 3: Refactor StoryletsSidebar

### 3.1 Make Sidebar Store-Driven

**File**: `src/components/ForgeWorkspace/components/StoryletsSidebar.tsx`

**Why**: Remove prop soup. Sidebar should read from store and use workspace actions. This makes it easier to understand and maintain.

**Changes**:

- Remove all props except `className` (if needed)
- Read storylet list from store: `useForgeWorkspaceStore(s => Object.values(s.graphs.byId).filter(g => g.kind === 'STORYLET'))`
- Read `activeStoryletGraphId` for selection
- Use local `useState` for search query (UI-only state)
- Use `useForgeWorkspaceActions` for opening graphs

**Implementation**:

```typescript
export function StoryletsSidebar({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Read from store
  const storyletGraphs = useForgeWorkspaceStore(s => 
    Object.values(s.graphs.byId).filter(g => g.kind === 'STORYLET')
  )
  const activeStoryletGraphId = useForgeWorkspaceStore(s => s.activeStoryletGraphId)
  const workspaceActions = useForgeWorkspaceActions()
  
  // Filter locally
  const filteredGraphs = storyletGraphs.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // ... rest of component
}
```

### 3.2 Add shadcn ContextMenu

**File**: `src/components/ForgeWorkspace/components/StoryletsSidebar.tsx`

**Why**: Better UX than separate buttons. Follows shadcn patterns already in use.

**Implementation**:

- Wrap each storylet entry in `ContextMenu` component
- Menu items:
  - "Open Graph" → `workspaceActions.openStoryletGraph(String(graph.id))`
  - "Edit Metadata" → (future: open metadata modal)
  - "Delete" → (future: delete graph)

### 3.3 Add Storylet Creation

**File**: `src/components/ForgeWorkspace/components/StoryletsSidebar.tsx`

**Why**: Users need to create new storylets. This should use the dataAdapter and workspace actions.

**Implementation**:

- "Add" button calls async function:

  1. Get `selectedProjectId` from store
  2. Create empty graph via `createEmptyForgeGraphDoc`
  3. Call `dataAdapter.createGraph()` to persist
  4. Add to cache via `setGraph`
  5. Open via `workspaceActions.openStoryletGraph`

**Note**: Need access to `dataAdapter` and `selectedProjectId`. Can get from store.

## Phase 4: Initialize with Seeded Data

### 4.1 Auto-Select First Project on Mount

**File**: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`

**Why**: If no project is selected but projects exist, auto-select the first one (likely the seeded "Demo Project"). This provides a better UX.

**Implementation**:

- Add subscription that runs once on mount
- If `selectedProjectId` is null and `dataAdapter` exists:
  - Call `dataAdapter.listProjects()`
  - If projects exist, set first one as selected
  - The project selection subscription will then load graphs

**Alternative**: Could do this in `ForgeWorkspace` component with `useEffect`, but subscription keeps it centralized.

### 4.2 Handle Empty State Gracefully

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

**Why**: If no graphs exist, show helpful empty state. Don't create defaults automatically - let user create via UI.

**Implementation**:

- Already handled in `ForgeWorkspaceInner` with "No graph loaded" messages
- Keep as-is, but ensure they're clear and actionable

## Implementation Order

1. **Phase 1.1**: Add dataAdapter to workspace store
2. **Phase 1.2**: Create cache-first resolver and wire it
3. **Phase 2.1**: Add project slice
4. **Phase 2.2**: Wire project selection from page
5. **Phase 2.3**: Add subscription for loading project graphs
6. **Phase 3.1**: Refactor StoryletsSidebar to be store-driven
7. **Phase 3.2**: Add shadcn ContextMenu
8. **Phase 3.3**: Add storylet creation
9. **Phase 4.1**: Auto-select first project
10. **Phase 4.2**: Verify empty states

## Key Principles

- **Cache-First**: Always check `graphs.byId` before calling adapter
- **Subscriptions for Side Effects**: Reactive logic lives in `subscriptions.ts`
- **Store-Driven Components**: Components read from store, not props
- **Workspace Actions**: Use `useForgeWorkspaceActions` for navigation
- **Clear Separation**: Projects, graphs, and UI state are separate concerns
- **Easy to Understand**: Each piece has a clear purpose and location

## Testing Strategy

- Test subscriptions independently by mocking store and adapter
- Test resolver cache behavior
- Test StoryletsSidebar with mock store data
- Integration test: select project → graphs load → sidebar shows them