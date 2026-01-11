import type { StateCreator } from "zustand"
import type { ForgeUIState } from "../createForgeUIStore"

export interface ModalsSlice {
  modals: {
    showPlayModal: boolean
    showGameStateModal: boolean
    showGuide: boolean
    showFlagManager: boolean
  }
}

export interface ModalsActions {
  setShowPlayModal: (open: boolean) => void
  setShowGameStateModal: (open: boolean) => void
  setShowGuide: (open: boolean) => void
  setShowFlagManager: (open: boolean) => void
}

export function createModalsSlice(
  set: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[0],
  get: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[1]
): ModalsSlice & ModalsActions {
  return {
    modals: {
      showPlayModal: false,
      showGameStateModal: false,
      showGuide: false,
      showFlagManager: false,
    },
    setShowPlayModal: open => set(state => ({ modals: { ...state.modals, showPlayModal: open } })),
    setShowGameStateModal: open => set(state => ({ modals: { ...state.modals, showGameStateModal: open } })),
    setShowGuide: open => set(state => ({ modals: { ...state.modals, showGuide: open } })),
    setShowFlagManager: open => set(state => ({ modals: { ...state.modals, showFlagManager: open } })),
  }
}
