import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"
import type { ForgeGraphDoc } from "@/src/types"

export interface GraphSlice {
  // Graph cache: by graph ID
  graphs: {
    byId: Record<string, ForgeGraphDoc>
    statusById: Record<string, "loading" | "ready" | "error">
  }
  
  // Active graphs (for narrative and storylet editors)
  narrativeGraph: ForgeGraphDoc | null
  storyletGraph: ForgeGraphDoc | null
  storyletGraphs: Record<string, ForgeGraphDoc> | null  
}

export interface GraphActions {
  setGraph: (id: string, graph: ForgeGraphDoc) => void
  setGraphStatus: (id: string, status: "loading" | "ready" | "error") => void
  setNarrativeGraph: (graph: ForgeGraphDoc | null) => void
  setStoryletGraph: (graph: ForgeGraphDoc | null) => void
  setStoryletGraphs: (graphs: Record<string, ForgeGraphDoc>) => void
  ensureGraph: (
    graphId: string,
    reason: "narrative" | "storylet",
    resolver?: (id: string) => Promise<ForgeGraphDoc>
  ) => Promise<void>
}

export function createGraphSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  initialNarrativeGraph?: ForgeGraphDoc | null,
  initialStoryletGraph?: ForgeGraphDoc | null,
  resolveGraph?: (id: string) => Promise<ForgeGraphDoc>
): GraphSlice & GraphActions {
  return {
    graphs: {
      byId: {},
      statusById: {},
    },
    narrativeGraph: initialNarrativeGraph ?? null,
    storyletGraph: initialStoryletGraph ?? null,
    storyletGraphs: {},
    
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
    
    setNarrativeGraph: (graph: ForgeGraphDoc | null) => {
      set({ narrativeGraph: graph })
      if (graph) {
        get().actions.setGraph(String(graph.id), graph)
      }
    },
    
    setStoryletGraph: (graph: ForgeGraphDoc | null) => {
      set({ storyletGraph: graph })
      if (graph) {
        get().actions.setGraph(String(graph.id), graph)
      }
    },
    
    setStoryletGraphs: (graphs: Record<string, ForgeGraphDoc>) => {
      set({ storyletGraphs: graphs })
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
        
        // Set as active graph based on reason
        if (reason === "narrative") {
          state.actions.setNarrativeGraph(graph)
        } else {
          state.actions.setStoryletGraph(graph)
        }
      } catch (error) {
        console.error(`Failed to load graph ${graphId}:`, error)
        state.actions.setGraphStatus(graphId, "error")
      }
    },
  }
}
