import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"
import type { ForgeGraphDoc } from "@/forge/types"
import { GRAPH_CHANGE_REASON, GRAPH_SCOPE } from "@/forge/types/constants"

export interface BreadcrumbItem {
  graphId: string
  title: string
  scope: "narrative" | "storylet"
}

export interface GraphSlice {
  // Graph cache: by graph ID
  graphs: {
    byId: Record<string, ForgeGraphDoc>
    statusById: Record<string, "loading" | "ready" | "error">
  }
  
  // Active graph IDs (for narrative and storylet editors)
  activeNarrativeGraphId: string | null
  activeStoryletGraphId: string | null
  
  // Breadcrumb navigation history per scope
  breadcrumbHistoryByScope: Record<"narrative" | "storylet", BreadcrumbItem[]>
}

export interface GraphActions {
  setGraph: (id: string, graph: ForgeGraphDoc) => void
  /** Set multiple graphs in one update to avoid excessive re-renders when loading a project. */
  setGraphs: (graphs: ForgeGraphDoc[]) => void
  setGraphStatus: (id: string, status: "loading" | "ready" | "error") => void
  removeGraph: (id: string) => void
  setActiveNarrativeGraphId: (id: string | null) => void
  setActiveStoryletGraphId: (id: string | null) => void
  ensureGraph: (
    graphId: string,
    reason: "narrative" | "storylet",
    resolver?: (id: string) => Promise<ForgeGraphDoc>
  ) => Promise<void>
  openGraphInScope: (
    scope: "narrative" | "storylet",
    graphId: string,
    opts?: { focusNodeId?: string; pushBreadcrumb?: boolean }
  ) => Promise<void>
  pushBreadcrumb: (item: BreadcrumbItem) => void
  popBreadcrumb: (scope: "narrative" | "storylet") => BreadcrumbItem | null
  clearBreadcrumbs: (scope: "narrative" | "storylet") => void
  navigateToBreadcrumb: (scope: "narrative" | "storylet", index: number) => Promise<void>
}

export function createGraphSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  initialNarrativeGraphId?: string | null,
  initialStoryletGraphId?: string | null,
  resolveGraph?: (id: string) => Promise<ForgeGraphDoc>
): GraphSlice & GraphActions {
  return {
    graphs: {
      byId: {},
      statusById: {},
    },
    activeNarrativeGraphId: initialNarrativeGraphId ?? null,
    activeStoryletGraphId: initialStoryletGraphId ?? null,
    breadcrumbHistoryByScope: {
      narrative: [],
      storylet: [],
    },
    
    setGraph: (id: string, graph: ForgeGraphDoc) => {
      set((state) => ({
        graphs: {
          ...state.graphs,
          byId: { ...state.graphs.byId, [id]: graph },
          statusById: { ...state.graphs.statusById, [id]: "ready" },
        },
      }))
    },

    setGraphs: (graphs: ForgeGraphDoc[]) => {
      if (graphs.length === 0) return
      set((state) => {
        const byId = { ...state.graphs.byId }
        const statusById = { ...state.graphs.statusById }
        for (const graph of graphs) {
          const id = String(graph.id)
          byId[id] = graph
          statusById[id] = "ready"
        }
        return {
          graphs: { ...state.graphs, byId, statusById },
        }
      })
    },

    setGraphStatus: (id: string, status: "loading" | "ready" | "error") => {
      set((state) => ({
        graphs: {
          ...state.graphs,
          statusById: { ...state.graphs.statusById, [id]: status },
        },
      }))
    },

    removeGraph: (id: string) => {
      set((state) => {
        if (!state.graphs.byId[id]) {
          return state
        }
        const { [id]: _removedGraph, ...byId } = state.graphs.byId
        const { [id]: _removedStatus, ...statusById } = state.graphs.statusById
        const nextNarrativeId = state.activeNarrativeGraphId === id ? null : state.activeNarrativeGraphId
        const nextStoryletId = state.activeStoryletGraphId === id ? null : state.activeStoryletGraphId
        return {
          graphs: {
            ...state.graphs,
            byId,
            statusById,
          },
          activeNarrativeGraphId: nextNarrativeId,
          activeStoryletGraphId: nextStoryletId,
          breadcrumbHistoryByScope: {
            narrative: state.breadcrumbHistoryByScope.narrative.filter((b) => b.graphId !== id),
            storylet: state.breadcrumbHistoryByScope.storylet.filter((b) => b.graphId !== id),
          },
        }
      })
    },
    
    setActiveNarrativeGraphId: (id: string | null) => {
      set({ activeNarrativeGraphId: id })
    },
    
    setActiveStoryletGraphId: (id: string | null) => {
      set({ activeStoryletGraphId: id })
    },
    
    ensureGraph: async (
      graphId: string,
      reason: "narrative" | "storylet",
      providedResolver?: (id: string) => Promise<ForgeGraphDoc>
    ) => {
      const state = get()
      
      // If already loaded, return
      if (state.graphs.byId[graphId] && state.graphs.statusById[graphId] === "ready") {
        return
      }
      
      // Use provided resolver or fallback
      const resolver = providedResolver ?? resolveGraph
      if (!resolver) {
        console.warn(`No resolver available for graph ${graphId}`)
        return
      }
      
      // Set loading status
      state.actions.setGraphStatus(graphId, "loading")
      
      try {
        const graph = await resolver(graphId)
        state.actions.setGraph(graphId, graph)
      } catch (error) {
        console.error(`Failed to load graph ${graphId}:`, error)
        state.actions.setGraphStatus(graphId, "error")
      }
    },
    
    openGraphInScope: async (
      scope: "narrative" | "storylet",
      graphId: string,
      opts?: { focusNodeId?: string; pushBreadcrumb?: boolean }
    ) => {
      const state = get()
      
      // Get graph title for breadcrumb
      const graph = state.graphs.byId[graphId]
      const graphTitle = graph?.title || `Graph ${graphId}`
      
      // Push breadcrumb if requested (default: true)
      if (opts?.pushBreadcrumb !== false) {
        state.actions.pushBreadcrumb({
          graphId,
          title: graphTitle,
          scope,
        })
      }
      
      // Set active graph ID
      if (scope === "narrative") {
        state.actions.setActiveNarrativeGraphId(graphId)
      } else {
        state.actions.setActiveStoryletGraphId(graphId)
      }
      
      // Ensure graph is loaded
      const graphScope = scope === "narrative" ? GRAPH_SCOPE.NARRATIVE : GRAPH_SCOPE.STORYLET
      await state.actions.ensureGraph(graphId, GRAPH_CHANGE_REASON.OPEN, graphScope)
      
      // Request focus if node ID provided
      if (opts?.focusNodeId) {
        state.actions.requestFocus(scope, graphId, opts.focusNodeId)
      }
    },
    
    pushBreadcrumb: (item: BreadcrumbItem) => {
      set((state) => {
        const scopeHistory = state.breadcrumbHistoryByScope[item.scope]
        // Don't add duplicate consecutive breadcrumbs
        const lastBreadcrumb = scopeHistory[scopeHistory.length - 1]
        if (lastBreadcrumb?.graphId === item.graphId && lastBreadcrumb?.scope === item.scope) {
          return state
        }
        return {
          breadcrumbHistoryByScope: {
            ...state.breadcrumbHistoryByScope,
            [item.scope]: [...scopeHistory, item],
          },
        }
      })
    },
    
    popBreadcrumb: (scope: "narrative" | "storylet") => {
      let popped: BreadcrumbItem | null = null
      set((state) => {
        const scopeHistory = state.breadcrumbHistoryByScope[scope]
        if (scopeHistory.length === 0) {
          return state
        }
        const newHistory = [...scopeHistory]
        popped = newHistory.pop() || null
        return {
          breadcrumbHistoryByScope: {
            ...state.breadcrumbHistoryByScope,
            [scope]: newHistory,
          },
        }
      })
      return popped
    },
    
    clearBreadcrumbs: (scope: "narrative" | "storylet") => {
      set((state) => ({
        breadcrumbHistoryByScope: {
          ...state.breadcrumbHistoryByScope,
          [scope]: [],
        },
      }))
    },
    
    navigateToBreadcrumb: async (scope: "narrative" | "storylet", index: number) => {
      const state = get()
      const scopeHistory = state.breadcrumbHistoryByScope[scope]
      if (index < 0 || index >= scopeHistory.length) {
        return
      }
      
      // Truncate breadcrumb history to the selected index
      const targetBreadcrumb = scopeHistory[index]
      set({
        breadcrumbHistoryByScope: {
          ...state.breadcrumbHistoryByScope,
          [scope]: scopeHistory.slice(0, index + 1),
        },
      })
      
      // Navigate to the selected graph
      await state.actions.openGraphInScope(targetBreadcrumb.scope, targetBreadcrumb.graphId, {
        pushBreadcrumb: false, // Don't push again since we're navigating to existing breadcrumb
      })
    },
  }
}
