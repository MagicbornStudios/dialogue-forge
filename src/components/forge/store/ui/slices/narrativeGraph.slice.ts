import type { StateCreator } from "zustand"
import type { ViewMode } from "@/src/types"
import type { NarrativeSelection } from "@/src/types/narrative"
import { VIEW_MODE } from "@/src/types/constants"
import type { ForgeUIState } from "../createForgeUIStore"

export interface NarrativeGraphSlice {
  narrativeGraph: {
    viewMode: ViewMode
    showMiniMap: boolean
    contextMenu: { x: number; y: number } | null
    selection: NarrativeSelection
  }
}

export interface NarrativeGraphActions {
  setNarrativeViewMode: (mode: ViewMode) => void
  setNarrativeContextMenu: (value: NarrativeGraphSlice["narrativeGraph"]["contextMenu"]) => void
  setNarrativeSelection: (updater: (prev: NarrativeSelection) => NarrativeSelection) => void
  toggleNarrativeMiniMap: () => void
}

export function createNarrativeGraphSlice(
  set: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[0],
  get: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[1],
  initialSelection: NarrativeSelection
): NarrativeGraphSlice & NarrativeGraphActions {
  return {
    narrativeGraph: {
      viewMode: VIEW_MODE.GRAPH,
      showMiniMap: true,
      contextMenu: null,
      selection: initialSelection,
    },
    setNarrativeViewMode: mode =>
      set(state => ({ narrativeGraph: { ...state.narrativeGraph, viewMode: mode } })),
    setNarrativeContextMenu: value =>
      set(state => ({ narrativeGraph: { ...state.narrativeGraph, contextMenu: value } })),
    setNarrativeSelection: updater =>
      set(state => ({
        narrativeGraph: { ...state.narrativeGraph, selection: updater(state.narrativeGraph.selection) },
      })),
    toggleNarrativeMiniMap: () =>
      set(state => ({
        narrativeGraph: { ...state.narrativeGraph, showMiniMap: !state.narrativeGraph.showMiniMap },
      })),
  }
}
