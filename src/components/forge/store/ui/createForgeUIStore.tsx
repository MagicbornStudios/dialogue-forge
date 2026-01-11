"use client"

import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import { useStore } from "zustand"
import { devtools } from "zustand/middleware"
import type { NarrativeSelection } from "@/src/types/narrative"
import { createLayoutSlice } from "./slices/layout.slice"
import { createNarrativeGraphSlice } from "./slices/narrativeGraph.slice"
import { createDialogueGraphSlice } from "./slices/dialogueGraph.slice"
import { createStoryletsPanelSlice } from "./slices/storyletsPanel.slice"
import { createModalsSlice } from "./slices/modals.slice"

export type DialoguePanelTab = "page" | "storyletTemplate"

export interface ForgeUIState {
  layout: ReturnType<typeof createLayoutSlice>["layout"]
  narrativeGraph: ReturnType<typeof createNarrativeGraphSlice>["narrativeGraph"]
  dialogueGraph: ReturnType<typeof createDialogueGraphSlice>["dialogueGraph"]
  storylets: ReturnType<typeof createStoryletsPanelSlice>["storylets"]
  modals: ReturnType<typeof createModalsSlice>["modals"]

  actions: {
    setNarrativeViewMode: ReturnType<typeof createNarrativeGraphSlice>["setNarrativeViewMode"]
    setDialogueViewMode: ReturnType<typeof createDialogueGraphSlice>["setDialogueViewMode"]
    setNarrativeContextMenu: ReturnType<typeof createNarrativeGraphSlice>["setNarrativeContextMenu"]
    setStoryletContextMenu: ReturnType<typeof createStoryletsPanelSlice>["setStoryletContextMenu"]
    setNarrativeSelection: ReturnType<typeof createNarrativeGraphSlice>["setNarrativeSelection"]
    toggleNarrativeMiniMap: ReturnType<typeof createNarrativeGraphSlice>["toggleNarrativeMiniMap"]
    setDialogueTab: ReturnType<typeof createDialogueGraphSlice>["setDialogueTab"]
    setPageDialogueId: ReturnType<typeof createDialogueGraphSlice>["setPageDialogueId"]
    setStoryletDialogueId: ReturnType<typeof createDialogueGraphSlice>["setStoryletDialogueId"]
    toggleDialogueMiniMap: ReturnType<typeof createDialogueGraphSlice>["toggleDialogueMiniMap"]
    setStoryletsTab: ReturnType<typeof createStoryletsPanelSlice>["setStoryletsTab"]
    setStoryletSearch: ReturnType<typeof createStoryletsPanelSlice>["setStoryletSearch"]
    setPoolSearch: ReturnType<typeof createStoryletsPanelSlice>["setPoolSearch"]
    setActivePoolId: ReturnType<typeof createStoryletsPanelSlice>["setActivePoolId"]
    setSelectedStoryletKey: ReturnType<typeof createStoryletsPanelSlice>["setSelectedStoryletKey"]
    setEditingStoryletId: ReturnType<typeof createStoryletsPanelSlice>["setEditingStoryletId"]
    setEditingPoolId: ReturnType<typeof createStoryletsPanelSlice>["setEditingPoolId"]
    setShowPlayModal: ReturnType<typeof createModalsSlice>["setShowPlayModal"]
    setShowGameStateModal: ReturnType<typeof createModalsSlice>["setShowGameStateModal"]
    setShowGuide: ReturnType<typeof createModalsSlice>["setShowGuide"]
    setShowFlagManager: ReturnType<typeof createModalsSlice>["setShowFlagManager"]
  }
}

export function createForgeUIStore(initialSelection: NarrativeSelection) {
  return createStore<ForgeUIState>()(
    devtools(
      (set, get) => {
        const layoutSlice = createLayoutSlice(set, get)
        const narrativeGraphSlice = createNarrativeGraphSlice(set, get, initialSelection)
        const dialogueGraphSlice = createDialogueGraphSlice(set, get)
        const storyletsPanelSlice = createStoryletsPanelSlice(set, get)
        const modalsSlice = createModalsSlice(set, get)

        return {
          ...layoutSlice,
          ...narrativeGraphSlice,
          ...dialogueGraphSlice,
          ...storyletsPanelSlice,
          ...modalsSlice,
          actions: {
            setNarrativeViewMode: narrativeGraphSlice.setNarrativeViewMode,
            setDialogueViewMode: dialogueGraphSlice.setDialogueViewMode,
            setNarrativeContextMenu: narrativeGraphSlice.setNarrativeContextMenu,
            setStoryletContextMenu: storyletsPanelSlice.setStoryletContextMenu,
            setNarrativeSelection: narrativeGraphSlice.setNarrativeSelection,
            toggleNarrativeMiniMap: narrativeGraphSlice.toggleNarrativeMiniMap,
            setDialogueTab: dialogueGraphSlice.setDialogueTab,
            setPageDialogueId: dialogueGraphSlice.setPageDialogueId,
            setStoryletDialogueId: dialogueGraphSlice.setStoryletDialogueId,
            toggleDialogueMiniMap: dialogueGraphSlice.toggleDialogueMiniMap,
            setStoryletsTab: storyletsPanelSlice.setStoryletsTab,
            setStoryletSearch: storyletsPanelSlice.setStoryletSearch,
            setPoolSearch: storyletsPanelSlice.setPoolSearch,
            setActivePoolId: storyletsPanelSlice.setActivePoolId,
            setSelectedStoryletKey: storyletsPanelSlice.setSelectedStoryletKey,
            setEditingStoryletId: storyletsPanelSlice.setEditingStoryletId,
            setEditingPoolId: storyletsPanelSlice.setEditingPoolId,
            setShowPlayModal: modalsSlice.setShowPlayModal,
            setShowGameStateModal: modalsSlice.setShowGameStateModal,
            setShowGuide: modalsSlice.setShowGuide,
            setShowFlagManager: modalsSlice.setShowFlagManager,
          },
        }
      },
      { name: "ForgeUIStore" }
    )
  )
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
