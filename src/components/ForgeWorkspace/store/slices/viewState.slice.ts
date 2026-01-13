import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export interface ViewStateSlice {
  graphScope: "narrative" | "storylet"
  storyletFocusId: string | null
}

export interface ViewStateActions {
  setGraphScope: (scope: "narrative" | "storylet") => void
  setStoryletFocusId: (id: string | null) => void
}

export function createViewStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    graphScope: "narrative",
    storyletFocusId: null,
    setGraphScope: scope => set({ graphScope: scope }),
    setStoryletFocusId: id => set({ storyletFocusId: id }),
  }
}
