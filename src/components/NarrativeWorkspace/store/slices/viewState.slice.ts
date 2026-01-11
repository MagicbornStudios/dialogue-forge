import type { StateCreator } from "zustand"
import type { NarrativeWorkspaceState } from "../narrative-workspace-store"

export interface ViewStateSlice {
  dialogueScope: "page" | "storylet"
  storyletFocusId: string | null
}

export interface ViewStateActions {
  setDialogueScope: (scope: "page" | "storylet") => void
  setStoryletFocusId: (id: string | null) => void
}

export function createViewStateSlice(
  set: Parameters<StateCreator<NarrativeWorkspaceState, [], [], NarrativeWorkspaceState>>[0],
  get: Parameters<StateCreator<NarrativeWorkspaceState, [], [], NarrativeWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    dialogueScope: "page",
    storyletFocusId: null,
    setDialogueScope: scope => set({ dialogueScope: scope }),
    setStoryletFocusId: id => set({ storyletFocusId: id }),
  }
}
