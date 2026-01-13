import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"
import type { ForgeGraphDoc } from "@/src/types"

export interface GraphSlice {
  // Graph cache: by graph ID
  graphs: {
    byId: Record<string, ForgeGraphDoc>
    statusById: Record<string, "loading" | "ready" | "error">
  }
  
  // Active graph IDs (for narrative and storylet editors)
  activeNarrativeGraphId: string | null
  activeStoryletGraphId: string | null
}

export interface GraphActions {
  setGraph: (id: string, graph: ForgeGraphDoc) => void
  setGraphStatus: (id: string, status: "loading" | "ready" | "error") => void
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
    opts?: { focusNodeId?: string }
  ) => Promise<void>
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
    
    setGraph: (id: string, graph: ForgeGraphDoc) => {
      set((state) => ({
        graphs: {
          ...state.graphs,
          byId: { ...state.graphs.byId, [id]: graph },
          statusById: { ...state.graphs.statusById, [id]: "ready" },
        },
      }))
    },
    
    setGraphStatus: (id: string, status: "loading" | "ready" | "error") => {
      set((state) => ({
        graphs: {
          ...state.graphs,
          statusById: { ...state.graphs.statusById, [id]: status },
        },
      }))
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
      opts?: { focusNodeId?: string }
    ) => {
      const state = get()
      
      // Set active graph ID
      if (scope === "narrative") {
        state.actions.setActiveNarrativeGraphId(graphId)
      } else {
        state.actions.setActiveStoryletGraphId(graphId)
      }
      
      // Ensure graph is loaded
      await state.actions.ensureGraph(graphId, scope)
      
      // Request focus if node ID provided
      if (opts?.focusNodeId) {
        const state = get() as any
        if (state.actions?.requestFocus) {
          state.actions.requestFocus(scope, graphId, opts.focusNodeId)
        }
      }
    },
  }
}
