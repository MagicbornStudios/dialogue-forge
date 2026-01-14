"use client"

import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import { useStore } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"
import { FORGE_GRAPH_KIND, type ForgeGraphDoc } from "@/src/types"
import type { ForgeGameState } from "@/src/types/forge-game-state"
import type { FlagSchema } from "@/src/types/flags"
import type { ForgeEvent } from "@/src/components/forge/events/events"
import { createEvent } from "@/src/components/forge/events/events"
import { FORGE_EVENT_TYPE, GRAPH_CHANGE_REASON, type GraphChangeReason, type GraphScope, GRAPH_SCOPE } from "@/src/types/constants"
import { createGraphSlice } from "./slices/graph.slice"
import { createGameStateSlice } from "./slices/gameState.slice"
import { createViewStateSlice } from "./slices/viewState.slice"
import { createProjectSlice } from "./slices/project.slice"
import type { ForgeDataAdapter } from "@/src/components/forge/forge-data-adapter/forge-data-adapter"

export interface EventSink {
  emit(event: ForgeEvent): void
}

export interface ForgeWorkspaceState {
  // Graph slice
  graphs: ReturnType<typeof createGraphSlice>["graphs"]
  activeNarrativeGraphId: ReturnType<typeof createGraphSlice>["activeNarrativeGraphId"]
  activeStoryletGraphId: ReturnType<typeof createGraphSlice>["activeStoryletGraphId"]
  breadcrumbHistoryByScope: ReturnType<typeof createGraphSlice>["breadcrumbHistoryByScope"]
  
  // Game state slice
  activeFlagSchema: ReturnType<typeof createGameStateSlice>["activeFlagSchema"]
  activeGameState: ReturnType<typeof createGameStateSlice>["activeGameState"]
  gameStateDraft: ReturnType<typeof createGameStateSlice>["gameStateDraft"]
  gameStateError: ReturnType<typeof createGameStateSlice>["gameStateError"]
  
  // View state slice
  graphScope: ReturnType<typeof createViewStateSlice>["graphScope"]
  storyletFocusId: ReturnType<typeof createViewStateSlice>["storyletFocusId"]
  pendingFocusByScope: ReturnType<typeof createViewStateSlice>["pendingFocusByScope"]
  panelLayout: ReturnType<typeof createViewStateSlice>["panelLayout"]

  // Project slice
  selectedProjectId: ReturnType<typeof createProjectSlice>["selectedProjectId"]

  // Data adapter
  dataAdapter?: ForgeDataAdapter

  actions: {
    // Graph actions
    setGraph: ReturnType<typeof createGraphSlice>["setGraph"]
    setGraphStatus: ReturnType<typeof createGraphSlice>["setGraphStatus"]
    setActiveNarrativeGraphId: ReturnType<typeof createGraphSlice>["setActiveNarrativeGraphId"]
    setActiveStoryletGraphId: ReturnType<typeof createGraphSlice>["setActiveStoryletGraphId"]
    ensureGraph: (
      graphId: string,
      reason: GraphChangeReason,
      scope: GraphScope,
      providedResolver?: (id: string) => Promise<ForgeGraphDoc>
    ) => Promise<void>
    openGraphInScope: ReturnType<typeof createGraphSlice>["openGraphInScope"]
    pushBreadcrumb: ReturnType<typeof createGraphSlice>["pushBreadcrumb"]
    popBreadcrumb: ReturnType<typeof createGraphSlice>["popBreadcrumb"]
    clearBreadcrumbs: ReturnType<typeof createGraphSlice>["clearBreadcrumbs"]
    navigateToBreadcrumb: ReturnType<typeof createGraphSlice>["navigateToBreadcrumb"]
    
    // Game state actions
    setActiveFlagSchema: ReturnType<typeof createGameStateSlice>["setActiveFlagSchema"]
    setActiveGameState: ReturnType<typeof createGameStateSlice>["setActiveGameState"]
    setGameStateDraft: ReturnType<typeof createGameStateSlice>["setGameStateDraft"]
    setGameStateError: ReturnType<typeof createGameStateSlice>["setGameStateError"]
    
    // View state actions
    setGraphScope: ReturnType<typeof createViewStateSlice>["setGraphScope"]
    setStoryletFocusId: ReturnType<typeof createViewStateSlice>["setStoryletFocusId"]
    requestFocus: ReturnType<typeof createViewStateSlice>["requestFocus"]
    clearFocus: ReturnType<typeof createViewStateSlice>["clearFocus"]
    togglePanel: ReturnType<typeof createViewStateSlice>["togglePanel"]
    dockPanel: ReturnType<typeof createViewStateSlice>["dockPanel"]
    undockPanel: ReturnType<typeof createViewStateSlice>["undockPanel"]
    
    // Project actions
    setSelectedProjectId: ReturnType<typeof createProjectSlice>["setSelectedProjectId"]
  }
}

export interface CreateForgeWorkspaceStoreOptions {
  initialNarrativeGraph?: ForgeGraphDoc | null
  initialStoryletGraph?: ForgeGraphDoc | null
  initialNarrativeGraphId?: string | null
  initialStoryletGraphId?: string | null
  initialFlagSchema?: FlagSchema
  initialGameState?: ForgeGameState
  resolveGraph?: (id: string) => Promise<ForgeGraphDoc>
  dataAdapter?: ForgeDataAdapter
}

export function createForgeWorkspaceStore(
  options: CreateForgeWorkspaceStoreOptions,
  eventSink: EventSink
) {
  const { 
    initialFlagSchema: flagSchema, 
    initialGameState: gameState, 
    initialNarrativeGraph, 
    initialStoryletGraph,
    initialNarrativeGraphId,
    initialStoryletGraphId,
    resolveGraph,
    dataAdapter
  } = options

  // Extract IDs from provided graphs if IDs not explicitly provided
  const narrativeGraphId = initialNarrativeGraphId ?? (initialNarrativeGraph ? String(initialNarrativeGraph.id) : null)
  const storyletGraphId = initialStoryletGraphId ?? (initialStoryletGraph ? String(initialStoryletGraph.id) : null)

  // Create cache-first resolver factory
  function createGraphResolver(
    getState: () => ForgeWorkspaceState,
    adapter?: ForgeDataAdapter
  ): (id: string) => Promise<ForgeGraphDoc> {
    return async (graphId: string): Promise<ForgeGraphDoc> => {
      const state = getState()
      
      // 1. Check cache first
      if (state.graphs.byId[graphId] && state.graphs.statusById[graphId] === "ready") {
        return state.graphs.byId[graphId]
      }
      
      // 2. If not in cache and adapter available, fetch via adapter
      if (!adapter) {
        throw new Error(`No dataAdapter available and graph ${graphId} not in cache`)
      }
      
      // 3. Fetch from adapter (graphId is string, adapter expects number)
      const graph = await adapter.getGraph(Number(graphId))
      
      // 4. Store in cache (this will also emit events via setGraphWithEvents)
      state.actions.setGraph(graphId, graph)
      
      return graph
    }
  }

  return createStore<ForgeWorkspaceState>()(
    devtools(
      persist(
        immer(
          (set, get) => {
        // Create resolver with get function (will have access to state once store is created)
        const graphResolver = createGraphResolver(get, dataAdapter)
        const finalResolver = resolveGraph ?? graphResolver
        
        const graphSlice = createGraphSlice(set, get, narrativeGraphId, storyletGraphId, finalResolver)
        
        // If initial graphs provided, add them to cache
        if (initialNarrativeGraph) {
          graphSlice.setGraph(String(initialNarrativeGraph.id), initialNarrativeGraph)
        }
        if (initialStoryletGraph) {
          graphSlice.setGraph(String(initialStoryletGraph.id), initialStoryletGraph)
        }
        const gameStateSlice = createGameStateSlice(set, get, flagSchema, gameState)
        const viewStateSlice = createViewStateSlice(set, get)
        const projectSlice = createProjectSlice(set, get)

        // Wrap setGraph to include event emission
        const setGraphWithEvents = (id: string, graph: ForgeGraphDoc) => {
          graphSlice.setGraph(id, graph)

          const scope = graph.kind === FORGE_GRAPH_KIND.NARRATIVE ? GRAPH_SCOPE.NARRATIVE : GRAPH_SCOPE.STORYLET
          const reason = GRAPH_CHANGE_REASON.OPEN

          // Emit changed event
          eventSink.emit(
            createEvent(FORGE_EVENT_TYPE.GRAPH_CHANGED, {
              graphId: id,
              graph: graph,
              reason: reason,
              scope: scope,  
            })
          )
        }

        // Wrap ensureGraph to include event emission
        const ensureGraphWithEvents = async (
          graphId: string,
          reason: GraphChangeReason,
          scope: GraphScope,
          providedResolver?: (id: string) => Promise<ForgeGraphDoc>
        ) => {
          const state = get()
          
          // If already loaded, return
          if (state.graphs.byId[graphId] && state.graphs.statusById[graphId] === "ready") {
            return
          }

          // Emit open requested event
          eventSink.emit(
            createEvent(FORGE_EVENT_TYPE.GRAPH_OPEN_REQUESTED, {
              graphId: graphId,
              reason: GRAPH_CHANGE_REASON.OPEN,
              scope: scope,
            })
          )

          // Call the original ensureGraph - convert scope to reason string
          const reasonStr = scope === GRAPH_SCOPE.NARRATIVE ? 'narrative' : 'storylet'
          await graphSlice.ensureGraph(graphId, reasonStr, providedResolver)
        }

        return {
          ...graphSlice,
          ...gameStateSlice,
          ...viewStateSlice,
          ...projectSlice,
          dataAdapter,
          actions: {
            // Graph actions
            setGraph: setGraphWithEvents,
            setGraphStatus: graphSlice.setGraphStatus,
            setActiveNarrativeGraphId: graphSlice.setActiveNarrativeGraphId,
            setActiveStoryletGraphId: graphSlice.setActiveStoryletGraphId,
            ensureGraph: ensureGraphWithEvents,
            openGraphInScope: graphSlice.openGraphInScope,
            pushBreadcrumb: graphSlice.pushBreadcrumb,
            popBreadcrumb: graphSlice.popBreadcrumb,
            clearBreadcrumbs: graphSlice.clearBreadcrumbs,
            navigateToBreadcrumb: graphSlice.navigateToBreadcrumb,
            
            // Game state actions
            setActiveFlagSchema: gameStateSlice.setActiveFlagSchema,
            setActiveGameState: gameStateSlice.setActiveGameState,
            setGameStateDraft: gameStateSlice.setGameStateDraft,
            setGameStateError: gameStateSlice.setGameStateError,
            
            // View state actions
            setGraphScope: viewStateSlice.setGraphScope,
            setStoryletFocusId: viewStateSlice.setStoryletFocusId,
            requestFocus: viewStateSlice.requestFocus,
            clearFocus: viewStateSlice.clearFocus,
            togglePanel: viewStateSlice.togglePanel,
            dockPanel: viewStateSlice.dockPanel,
            undockPanel: viewStateSlice.undockPanel,
            
            // Project actions
            setSelectedProjectId: projectSlice.setSelectedProjectId,
          },
        }
        }),
        {
          name: 'forge-workspace-panel-layout',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({
            panelLayout: {
              sidebar: { visible: state.panelLayout.sidebar.visible, isDocked: false },
              narrativeEditor: { visible: state.panelLayout.narrativeEditor.visible, isDocked: false },
              storyletEditor: { visible: state.panelLayout.storyletEditor.visible, isDocked: false },
            },
          }),
        }
      ),
      { name: "ForgeWorkspaceStore" }
    )
  )
}

export type ForgeWorkspaceStore = ReturnType<typeof createForgeWorkspaceStore>

const ForgeWorkspaceStoreContext = createContext<ForgeWorkspaceStore | null>(null)

export function ForgeWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: ForgeWorkspaceStore }>) {
  return (
    <ForgeWorkspaceStoreContext.Provider value={store}>
      {children}
    </ForgeWorkspaceStoreContext.Provider>
  )
}

export function useForgeWorkspaceStore<T>(
  selector: (state: ForgeWorkspaceState) => T
): T {
  const store = useContext(ForgeWorkspaceStoreContext)
  if (!store) {
    throw new Error(
      "useForgeWorkspaceStore must be used within ForgeWorkspaceStoreProvider"
    )
  }
  return useStore(store, selector)
}
