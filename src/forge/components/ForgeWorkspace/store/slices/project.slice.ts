import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export interface ProjectSlice {
  selectedProjectId: number | null
}

export interface ProjectActions {
  setSelectedProjectId: (id: number | null) => void
}

export function createProjectSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1]
): ProjectSlice & ProjectActions {
  return {
    selectedProjectId: null,
    setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  }
}
