import type { StateCreator } from "zustand"
import type { ForgeUIState } from "../createForgeUIStore"

export interface StoryletsPanelSlice {
  storylets: {
    tab: "storylets" | "pools"
    storyletSearch: string
    poolSearch: string
    activePoolId: string | null
    selectedStoryletKey: string | null
    editingStoryletId: string | null
    editingPoolId: string | null
    contextMenu:
      | {
          x: number
          y: number
          entry: {
            poolId: string
            templateId: string
          }
        }
      | null
  }
}

export interface StoryletsPanelActions {
  setStoryletsTab: (tab: StoryletsPanelSlice["storylets"]["tab"]) => void
  setStoryletSearch: (query: string) => void
  setPoolSearch: (query: string) => void
  setActivePoolId: (id: string | null) => void
  setSelectedStoryletKey: (key: string | null) => void
  setEditingStoryletId: (id: string | null) => void
  setEditingPoolId: (id: string | null) => void
  setStoryletContextMenu: (value: StoryletsPanelSlice["storylets"]["contextMenu"]) => void
}

export function createStoryletsPanelSlice(
  set: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[0],
  get: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[1]
): StoryletsPanelSlice & StoryletsPanelActions {
  return {
    storylets: {
      tab: "storylets",
      storyletSearch: "",
      poolSearch: "",
      activePoolId: null,
      selectedStoryletKey: null,
      editingStoryletId: null,
      editingPoolId: null,
      contextMenu: null,
    },
    setStoryletsTab: tab => set(state => ({ storylets: { ...state.storylets, tab } })),
    setStoryletSearch: query => set(state => ({ storylets: { ...state.storylets, storyletSearch: query } })),
    setPoolSearch: query => set(state => ({ storylets: { ...state.storylets, poolSearch: query } })),
    setActivePoolId: id => set(state => ({ storylets: { ...state.storylets, activePoolId: id } })),
    setSelectedStoryletKey: key => set(state => ({ storylets: { ...state.storylets, selectedStoryletKey: key } })),
    setEditingStoryletId: id => set(state => ({ storylets: { ...state.storylets, editingStoryletId: id } })),
    setEditingPoolId: id => set(state => ({ storylets: { ...state.storylets, editingPoolId: id } })),
    setStoryletContextMenu: value =>
      set(state => ({ storylets: { ...state.storylets, contextMenu: value } })),
  }
}
