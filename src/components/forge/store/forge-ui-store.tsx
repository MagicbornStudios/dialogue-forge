"use client"

import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import { useStore } from "zustand"
import type { ViewMode } from "@/src/types"
import { VIEW_MODE } from "@/src/types/constants"
import type { NarrativeSelection } from "@/src/components/NarrativeEditor"

export type DialoguePanelTab = "page" | "storyletTemplate"

export interface ForgeUISliceLayout {
  // Reserved for future split panes / dock layout
}

export interface ForgeUISliceNarrativeGraph {
  viewMode: ViewMode
  showMiniMap: boolean
  contextMenu: { x: number; y: number } | null
  selection: NarrativeSelection
}

export interface ForgeUISliceDialogueGraph {
  viewMode: ViewMode
  showMiniMap: boolean
  activeTab: DialoguePanelTab
  pageDialogueId: string | null
  storyletDialogueId: string | null
}

export interface ForgeUISliceStoryletsPanel {
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

export interface ForgeUISliceModals {
  showPlayModal: boolean
  showGameStateModal: boolean
  showGuide: boolean
}

export interface ForgeUIState {
  layout: ForgeUISliceLayout
  narrativeGraph: ForgeUISliceNarrativeGraph
  dialogueGraph: ForgeUISliceDialogueGraph
  storylets: ForgeUISliceStoryletsPanel
  modals: ForgeUISliceModals

  actions: {
    setNarrativeViewMode: (mode: ViewMode) => void
    setDialogueViewMode: (mode: ViewMode) => void
    setNarrativeMiniMap: (value: boolean) => void
    setDialogueMiniMap: (value: boolean) => void
    setNarrativeContextMenu: (value: ForgeUISliceNarrativeGraph["contextMenu"]) => void
    setStoryletContextMenu: (value: ForgeUISliceStoryletsPanel["contextMenu"]) => void

    setNarrativeSelection: (updater: (prev: NarrativeSelection) => NarrativeSelection) => void
    setDialogueTab: (tab: DialoguePanelTab) => void
    setPageDialogueId: (id: string | null) => void
    setStoryletDialogueId: (id: string | null) => void

    setStoryletsTab: (tab: ForgeUISliceStoryletsPanel["tab"]) => void
    setStoryletSearch: (query: string) => void
    setPoolSearch: (query: string) => void
    setActivePoolId: (id: string | null) => void
    setSelectedStoryletKey: (key: string | null) => void
    setEditingStoryletId: (id: string | null) => void
    setEditingPoolId: (id: string | null) => void

    setShowPlayModal: (open: boolean) => void
    setShowGameStateModal: (open: boolean) => void
    setShowGuide: (open: boolean) => void
  }
}

export function createForgeUIStore(initialSelection: NarrativeSelection) {
  return createStore<ForgeUIState>()(set => ({
    layout: {},
    narrativeGraph: {
      viewMode: VIEW_MODE.GRAPH,
      showMiniMap: true,
      contextMenu: null,
      selection: initialSelection,
    },
    dialogueGraph: {
      viewMode: VIEW_MODE.GRAPH,
      showMiniMap: true,
      activeTab: "page",
      pageDialogueId: null,
      storyletDialogueId: null,
    },
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
    modals: {
      showPlayModal: false,
      showGameStateModal: false,
      showGuide: false,
    },
    actions: {
      setNarrativeViewMode: mode =>
        set(state => ({ narrativeGraph: { ...state.narrativeGraph, viewMode: mode } })),
      setDialogueViewMode: mode =>
        set(state => ({ dialogueGraph: { ...state.dialogueGraph, viewMode: mode } })),
      setNarrativeMiniMap: value =>
        set(state => ({ narrativeGraph: { ...state.narrativeGraph, showMiniMap: value } })),
      setDialogueMiniMap: value =>
        set(state => ({ dialogueGraph: { ...state.dialogueGraph, showMiniMap: value } })),
      setNarrativeContextMenu: value =>
        set(state => ({ narrativeGraph: { ...state.narrativeGraph, contextMenu: value } })),
      setStoryletContextMenu: value =>
        set(state => ({ storylets: { ...state.storylets, contextMenu: value } })),

      setNarrativeSelection: updater =>
        set(state => ({
          narrativeGraph: { ...state.narrativeGraph, selection: updater(state.narrativeGraph.selection) },
        })),

      setDialogueTab: tab => set(state => ({ dialogueGraph: { ...state.dialogueGraph, activeTab: tab } })),
      setPageDialogueId: id => set(state => ({ dialogueGraph: { ...state.dialogueGraph, pageDialogueId: id } })),
      setStoryletDialogueId: id =>
        set(state => ({ dialogueGraph: { ...state.dialogueGraph, storyletDialogueId: id } })),

      setStoryletsTab: tab => set(state => ({ storylets: { ...state.storylets, tab } })),
      setStoryletSearch: query => set(state => ({ storylets: { ...state.storylets, storyletSearch: query } })),
      setPoolSearch: query => set(state => ({ storylets: { ...state.storylets, poolSearch: query } })),
      setActivePoolId: id => set(state => ({ storylets: { ...state.storylets, activePoolId: id } })),
      setSelectedStoryletKey: key => set(state => ({ storylets: { ...state.storylets, selectedStoryletKey: key } })),
      setEditingStoryletId: id => set(state => ({ storylets: { ...state.storylets, editingStoryletId: id } })),
      setEditingPoolId: id => set(state => ({ storylets: { ...state.storylets, editingPoolId: id } })),

      setShowPlayModal: open => set(state => ({ modals: { ...state.modals, showPlayModal: open } })),
      setShowGameStateModal: open => set(state => ({ modals: { ...state.modals, showGameStateModal: open } })),
      setShowGuide: open => set(state => ({ modals: { ...state.modals, showGuide: open } })),
    },
  }))
}

export type ForgeUIStore = ReturnType<typeof createForgeUIStore>

const ForgeUIStoreContext = createContext<ForgeUIStore | null>(null)

export function ForgeUIStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: ForgeUIStore }>) {
  return <ForgeUIStoreContext.Provider value={store}>{children}</ForgeUIStoreContext.Provider>
}

export function useForgeUIStore<T>(selector: (state: ForgeUIState) => T): T {
  const store = useContext(ForgeUIStoreContext)
  if (!store) {
    throw new Error("useForgeUIStore must be used within ForgeUIStoreProvider")
  }
  return useStore(store, selector)
}

