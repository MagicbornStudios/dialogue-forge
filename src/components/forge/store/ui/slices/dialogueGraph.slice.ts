import type { StateCreator } from "zustand"
import type { ViewMode } from "@/src/types"
import { VIEW_MODE } from "@/src/types/constants"
import type { ForgeUIState, DialoguePanelTab } from "../createForgeUIStore"

export interface DialogueGraphSlice {
  dialogueGraph: {
    viewMode: ViewMode
    showMiniMap: boolean
    activeTab: DialoguePanelTab
    pageDialogueId: string | null
    storyletDialogueId: string | null
  }
}

export interface DialogueGraphActions {
  setDialogueViewMode: (mode: ViewMode) => void
  setDialogueTab: (tab: DialoguePanelTab) => void
  setPageDialogueId: (id: string | null) => void
  setStoryletDialogueId: (id: string | null) => void
  toggleDialogueMiniMap: () => void
}

export function createDialogueGraphSlice(
  set: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[0],
  get: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[1]
): DialogueGraphSlice & DialogueGraphActions {
  return {
    dialogueGraph: {
      viewMode: VIEW_MODE.GRAPH,
      showMiniMap: true,
      activeTab: "page",
      pageDialogueId: null,
      storyletDialogueId: null,
    },
    setDialogueViewMode: mode =>
      set(state => ({ dialogueGraph: { ...state.dialogueGraph, viewMode: mode } })),
    setDialogueTab: tab => set(state => ({ dialogueGraph: { ...state.dialogueGraph, activeTab: tab } })),
    setPageDialogueId: id => set(state => ({ dialogueGraph: { ...state.dialogueGraph, pageDialogueId: id } })),
    setStoryletDialogueId: id =>
      set(state => ({ dialogueGraph: { ...state.dialogueGraph, storyletDialogueId: id } })),
    toggleDialogueMiniMap: () =>
      set(state => ({
        dialogueGraph: { ...state.dialogueGraph, showMiniMap: !state.dialogueGraph.showMiniMap },
      })),
  }
}
