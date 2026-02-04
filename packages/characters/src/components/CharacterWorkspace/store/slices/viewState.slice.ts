/**
 * View state slice for character workspace
 * Manages UI state like tool mode, sidebar state, etc.
 */

import { TOOL_MODE, type ToolMode } from '@magicborn/characters/types'

export interface ViewStateSlice {
  // State
  toolMode: ToolMode
  sidebarSearchQuery: string
  showLabels: boolean
  selectedCharacterId: string | null // Sidebar selection (not graph selection)
  isCreateCharacterModalOpen: boolean
  isDebugDrawerOpen: boolean
}

export interface ViewStateActions {
  setToolMode: (mode: ToolMode) => void
  setSidebarSearchQuery: (query: string) => void
  setShowLabels: (show: boolean) => void
  setSelectedCharacterId: (id: string | null) => void
  openCreateCharacterModal: () => void
  closeCreateCharacterModal: () => void
  openDebugDrawer: () => void
  closeDebugDrawer: () => void
}

export function createViewStateSlice(
  set: any,
  get: any
): ViewStateSlice & ViewStateActions {
  return {
  // Initial state
  toolMode: TOOL_MODE.SELECT,
  sidebarSearchQuery: '',
  showLabels: true,
  selectedCharacterId: null,
  isCreateCharacterModalOpen: false,
  isDebugDrawerOpen: false,

  // Actions
  setToolMode: (mode) => {
    set((state: ViewStateSlice) => {
      state.toolMode = mode
    })
  },

  setSidebarSearchQuery: (query) => {
    set((state: ViewStateSlice) => {
      state.sidebarSearchQuery = query
    })
  },

  setShowLabels: (show) => {
    set((state: ViewStateSlice) => {
      state.showLabels = show
    })
  },

  setSelectedCharacterId: (id) => {
    set((state: ViewStateSlice) => {
      state.selectedCharacterId = id
    })
  },

  openCreateCharacterModal: () => {
    set((state: ViewStateSlice) => {
      state.isCreateCharacterModalOpen = true
    })
  },

  closeCreateCharacterModal: () => {
    set((state: ViewStateSlice) => {
      state.isCreateCharacterModalOpen = false
    })
  },

  openDebugDrawer: () => {
    set((state: ViewStateSlice) => {
      state.isDebugDrawerOpen = true
    })
  },

  closeDebugDrawer: () => {
    set((state: ViewStateSlice) => {
      state.isDebugDrawerOpen = false
    })
  },
  }
}
