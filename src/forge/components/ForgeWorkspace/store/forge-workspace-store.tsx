"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import type { StoreApi } from "zustand/vanilla"
import { useStore } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"
import { FORGE_GRAPH_KIND, type ForgeGraphDoc } from "@/forge/types"
import type { ForgeGameState, ForgeGameStateRecord } from "@/forge/types/forge-game-state"
import type { FlagSchema } from "@/forge/types/flags"
import type { ForgeEvent } from "@/forge/events/events"
import { createEvent } from "@/forge/events/events"
import { FORGE_EVENT_TYPE, GRAPH_CHANGE_REASON, type GraphChangeReason, type GraphScope, GRAPH_SCOPE } from "@/forge/types/constants"
import { createGraphSlice } from "@/forge/components/ForgeWorkspace/store/slices/graph.slice"
import { createGameStateSlice } from "@/forge/components/ForgeWorkspace/store/slices/gameState.slice"
import { createViewStateSlice } from "@/forge/components/ForgeWorkspace/store/slices/viewState.slice"
import { createProjectSlice } from "@/forge/components/ForgeWorkspace/store/slices/project.slice"
import { createForgeDraftSlice } from "@/forge/components/ForgeWorkspace/store/slices/draft.slice"
import type { ForgeDataAdapter } from "@/forge/adapters/forge-data-adapter"
import type { VideoTemplateWorkspaceAdapter } from "@/video/workspace/video-template-workspace-contracts"
import type { VideoTemplateOverrides } from "@/video/templates/types/video-template-overrides"

export interface EventSink {
  emit(event: ForgeEvent): void
}

export interface ForgeWorkspaceState {
  // Graph slice
  graphs: ReturnType<typeof createGraphSlice>["graphs"]
  activeNarrativeGraphId: ReturnType<typeof createGraphSlice>["activeNarrativeGraphId"]
  activeStoryletGraphId: ReturnType<typeof createGraphSlice>["activeStoryletGraphId"]
  breadcrumbHistoryByScope: ReturnType<typeof createGraphSlice>["breadcrumbHistoryByScope"]

  // Draft slice
  committedGraph: ReturnType<typeof createForgeDraftSlice>["committedGraph"]
  draftGraph: ReturnType<typeof createForgeDraftSlice>["draftGraph"]
  deltas: ReturnType<typeof createForgeDraftSlice>["deltas"]
  validation: ReturnType<typeof createForgeDraftSlice>["validation"]
  hasUncommittedChanges: ReturnType<typeof createForgeDraftSlice>["hasUncommittedChanges"]
  lastCommittedAt: ReturnType<typeof createForgeDraftSlice>["lastCommittedAt"]
  
  // Game state slice
  activeFlagSchema: ReturnType<typeof createGameStateSlice>["activeFlagSchema"]
  gameStatesById: ReturnType<typeof createGameStateSlice>["gameStatesById"]
  activeGameStateId: ReturnType<typeof createGameStateSlice>["activeGameStateId"]
  activeGameState: ReturnType<typeof createGameStateSlice>["activeGameState"]
  gameStateDraft: ReturnType<typeof createGameStateSlice>["gameStateDraft"]
  gameStateError: ReturnType<typeof createGameStateSlice>["gameStateError"]
  loadedFlagSchemaProjectId: ReturnType<typeof createGameStateSlice>["loadedFlagSchemaProjectId"]
  loadedGameStatesProjectId: ReturnType<typeof createGameStateSlice>["loadedGameStatesProjectId"]
  
  // View state slice
  graphScope: ReturnType<typeof createViewStateSlice>["graphScope"]
  storyletFocusId: ReturnType<typeof createViewStateSlice>["storyletFocusId"]
  pendingFocusByScope: ReturnType<typeof createViewStateSlice>["pendingFocusByScope"]
  contextNodeTypeByScope: ReturnType<typeof createViewStateSlice>["contextNodeTypeByScope"]
  panelLayout: ReturnType<typeof createViewStateSlice>["panelLayout"]
  focusedEditor: ReturnType<typeof createViewStateSlice>["focusedEditor"]
  modalState: ReturnType<typeof createViewStateSlice>["modalState"]
  copilotVisible: ReturnType<typeof createViewStateSlice>["copilotVisible"]

  // Project slice
  selectedProjectId: ReturnType<typeof createProjectSlice>["selectedProjectId"]

  // Data adapter
  dataAdapter?: ForgeDataAdapter
  videoTemplateAdapter?: VideoTemplateWorkspaceAdapter
  videoTemplateOverrides?: VideoTemplateOverrides

  actions: {
    // Graph actions
    setGraph: ReturnType<typeof createGraphSlice>["setGraph"]
    setGraphs: ReturnType<typeof createGraphSlice>["setGraphs"]
    setGraphStatus: ReturnType<typeof createGraphSlice>["setGraphStatus"]
    removeGraph: ReturnType<typeof createGraphSlice>["removeGraph"]
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

    // Draft actions
    applyDelta: ReturnType<typeof createForgeDraftSlice>["applyDelta"]
    commitDraft: ReturnType<typeof createForgeDraftSlice>["commitDraft"]
    discardDraft: ReturnType<typeof createForgeDraftSlice>["discardDraft"]
    resetDraft: ReturnType<typeof createForgeDraftSlice>["resetDraft"]
    getDraftGraph: ReturnType<typeof createForgeDraftSlice>["getDraftGraph"]
    getCommittedGraph: ReturnType<typeof createForgeDraftSlice>["getCommittedGraph"]
    
    // Game state actions
    setActiveFlagSchema: ReturnType<typeof createGameStateSlice>["setActiveFlagSchema"]
    setGameStates: ReturnType<typeof createGameStateSlice>["setGameStates"]
    setActiveGameStateId: ReturnType<typeof createGameStateSlice>["setActiveGameStateId"]
    setActiveGameState: ReturnType<typeof createGameStateSlice>["setActiveGameState"]
    upsertGameState: ReturnType<typeof createGameStateSlice>["upsertGameState"]
    removeGameState: ReturnType<typeof createGameStateSlice>["removeGameState"]
    setGameStateDraft: ReturnType<typeof createGameStateSlice>["setGameStateDraft"]
    setGameStateError: ReturnType<typeof createGameStateSlice>["setGameStateError"]
    
    // View state actions
    setGraphScope: ReturnType<typeof createViewStateSlice>["setGraphScope"]
    setStoryletFocusId: ReturnType<typeof createViewStateSlice>["setStoryletFocusId"]
    requestFocus: ReturnType<typeof createViewStateSlice>["requestFocus"]
    clearFocus: ReturnType<typeof createViewStateSlice>["clearFocus"]
    setContextNodeType: ReturnType<typeof createViewStateSlice>["setContextNodeType"]
    togglePanel: ReturnType<typeof createViewStateSlice>["togglePanel"]
    dockPanel: ReturnType<typeof createViewStateSlice>["dockPanel"]
    undockPanel: ReturnType<typeof createViewStateSlice>["undockPanel"]
    setFocusedEditor: ReturnType<typeof createViewStateSlice>["setFocusedEditor"]
    openPlayModal: ReturnType<typeof createViewStateSlice>["openPlayModal"]
    closePlayModal: ReturnType<typeof createViewStateSlice>["closePlayModal"]
    openYarnModal: ReturnType<typeof createViewStateSlice>["openYarnModal"]
    closeYarnModal: ReturnType<typeof createViewStateSlice>["closeYarnModal"]
    openFlagModal: ReturnType<typeof createViewStateSlice>["openFlagModal"]
    closeFlagModal: ReturnType<typeof createViewStateSlice>["closeFlagModal"]
    openGuide: ReturnType<typeof createViewStateSlice>["openGuide"]
    closeGuide: ReturnType<typeof createViewStateSlice>["closeGuide"]
    openCopilotChat: ReturnType<typeof createViewStateSlice>["openCopilotChat"]
    closeCopilotChat: ReturnType<typeof createViewStateSlice>["closeCopilotChat"]
    setCopilotVisible: ReturnType<typeof createViewStateSlice>["setCopilotVisible"]
    
    // Project actions
    setSelectedProjectId: ReturnType<typeof createProjectSlice>["setSelectedProjectId"]
    setVideoTemplateOverrides: (overrides?: VideoTemplateOverrides) => void
  }
}

export interface CreateForgeWorkspaceStoreOptions {
  initialNarrativeGraph?: ForgeGraphDoc | null
  initialStoryletGraph?: ForgeGraphDoc | null
  initialNarrativeGraphId?: string | null
  initialStoryletGraphId?: string | null
  initialFlagSchema?: FlagSchema
  initialGameState?: ForgeGameState
  initialGameStates?: ForgeGameStateRecord[]
  resolveGraph?: (id: string) => Promise<ForgeGraphDoc>
  dataAdapter?: ForgeDataAdapter
  videoTemplateAdapter?: VideoTemplateWorkspaceAdapter
  videoTemplateOverrides?: VideoTemplateOverrides
}

export function createForgeWorkspaceStore(
  options: CreateForgeWorkspaceStoreOptions,
  eventSink: EventSink
): StoreApi<ForgeWorkspaceState> {
  const { 
    initialFlagSchema: flagSchema, 
    initialGameState: gameState,
    initialGameStates,
    initialNarrativeGraph, 
    initialStoryletGraph,
    initialNarrativeGraphId,
    initialStoryletGraphId,
    resolveGraph,
    dataAdapter,
    videoTemplateAdapter,
    videoTemplateOverrides,
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
        const initialDraftGraph = initialNarrativeGraph ?? initialStoryletGraph ?? null
        const draftSlice = createForgeDraftSlice(set, get, initialDraftGraph)
        
        // If initial graphs provided, add them to cache
        if (initialNarrativeGraph) {
          graphSlice.setGraph(String(initialNarrativeGraph.id), initialNarrativeGraph)
        }
        if (initialStoryletGraph) {
          graphSlice.setGraph(String(initialStoryletGraph.id), initialStoryletGraph)
        }
        const gameStateSlice = createGameStateSlice(set, get, flagSchema, gameState)
        if (initialGameStates?.length) {
          gameStateSlice.setGameStates(initialGameStates)
        }
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
          ...draftSlice,
          ...gameStateSlice,
          ...viewStateSlice,
          ...projectSlice,
          dataAdapter,
          videoTemplateAdapter,
          videoTemplateOverrides,
          actions: {
            // Graph actions
            setGraph: setGraphWithEvents,
            setGraphs: graphSlice.setGraphs,
            setGraphStatus: graphSlice.setGraphStatus,
            removeGraph: graphSlice.removeGraph,
            setActiveNarrativeGraphId: graphSlice.setActiveNarrativeGraphId,
            setActiveStoryletGraphId: graphSlice.setActiveStoryletGraphId,
            ensureGraph: ensureGraphWithEvents,
            openGraphInScope: graphSlice.openGraphInScope,
            pushBreadcrumb: graphSlice.pushBreadcrumb,
            popBreadcrumb: graphSlice.popBreadcrumb,
            clearBreadcrumbs: graphSlice.clearBreadcrumbs,
            navigateToBreadcrumb: graphSlice.navigateToBreadcrumb,

            // Draft actions
            applyDelta: draftSlice.applyDelta,
            commitDraft: draftSlice.commitDraft,
            discardDraft: draftSlice.discardDraft,
            resetDraft: draftSlice.resetDraft,
            getDraftGraph: draftSlice.getDraftGraph,
            getCommittedGraph: draftSlice.getCommittedGraph,
            
            // Game state actions
            setActiveFlagSchema: gameStateSlice.setActiveFlagSchema,
            setGameStates: gameStateSlice.setGameStates,
            setActiveGameStateId: gameStateSlice.setActiveGameStateId,
            setActiveGameState: gameStateSlice.setActiveGameState,
            upsertGameState: gameStateSlice.upsertGameState,
            removeGameState: gameStateSlice.removeGameState,
            setGameStateDraft: gameStateSlice.setGameStateDraft,
            setGameStateError: gameStateSlice.setGameStateError,
            
            // View state actions
            setGraphScope: viewStateSlice.setGraphScope,
            setStoryletFocusId: viewStateSlice.setStoryletFocusId,
            requestFocus: viewStateSlice.requestFocus,
            clearFocus: viewStateSlice.clearFocus,
            setContextNodeType: viewStateSlice.setContextNodeType,
            togglePanel: viewStateSlice.togglePanel,
            dockPanel: viewStateSlice.dockPanel,
            undockPanel: viewStateSlice.undockPanel,
            setFocusedEditor: viewStateSlice.setFocusedEditor,
            openPlayModal: viewStateSlice.openPlayModal,
            closePlayModal: viewStateSlice.closePlayModal,
            openYarnModal: viewStateSlice.openYarnModal,
            closeYarnModal: viewStateSlice.closeYarnModal,
            openFlagModal: viewStateSlice.openFlagModal,
            closeFlagModal: viewStateSlice.closeFlagModal,
            openGuide: viewStateSlice.openGuide,
            closeGuide: viewStateSlice.closeGuide,
            openCopilotChat: viewStateSlice.openCopilotChat,
            closeCopilotChat: viewStateSlice.closeCopilotChat,
            setCopilotVisible: viewStateSlice.setCopilotVisible,
            
            // Project actions
            setSelectedProjectId: projectSlice.setSelectedProjectId,
            setVideoTemplateOverrides: (overrides?: VideoTemplateOverrides) => {
              set((state) => {
                state.videoTemplateOverrides = overrides
              })
            },
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
              nodeEditor: { visible: state.panelLayout.nodeEditor?.visible ?? false, isDocked: false },
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

export function useForgeWorkspaceStoreInstance(): ForgeWorkspaceStore {
  const store = useContext(ForgeWorkspaceStoreContext)
  if (!store) {
    throw new Error(
      "useForgeWorkspaceStoreInstance must be used within ForgeWorkspaceStoreProvider"
    )
  }
  return store
}
