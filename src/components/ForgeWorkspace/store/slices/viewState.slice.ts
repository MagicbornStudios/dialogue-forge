import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export interface ViewStateSlice {
  graphScope: "narrative" | "storylet"
  storyletFocusId: string | null
  pendingFocusByScope: {
    narrative?: { graphId: string; nodeId?: string }
    storylet?: { graphId: string; nodeId?: string }
  }
}

export interface ViewStateActions {
  setGraphScope: (scope: "narrative" | "storylet") => void
  setStoryletFocusId: (id: string | null) => void
  requestFocus: (scope: "narrative" | "storylet", graphId: string, nodeId?: string) => void
  clearFocus: (scope: "narrative" | "storylet") => void
}

export function createViewStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    graphScope: "narrative",
    storyletFocusId: null,
    pendingFocusByScope: {},
    setGraphScope: scope => set({ graphScope: scope }),
    setStoryletFocusId: id => set({ storyletFocusId: id }),
    requestFocus: (scope, graphId, nodeId) => {
      set((state) => ({
        pendingFocusByScope: {
          ...state.pendingFocusByScope,
          [scope]: { graphId, nodeId },
        },
      }))
    },
    clearFocus: (scope) => {
      set((state) => {
        const next = { ...state.pendingFocusByScope }
        delete next[scope]
        return { pendingFocusByScope: next }
      })
    },
  }
}
