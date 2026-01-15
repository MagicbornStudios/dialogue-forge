import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export interface PanelLayoutState {
  sidebar: {
    visible: boolean;
    isDocked: boolean; // Whether panel is in fullscreen docked mode
  };
  narrativeEditor: {
    visible: boolean;
    isDocked: boolean; // Whether panel is in fullscreen docked mode
  };
  storyletEditor: {
    visible: boolean;
    isDocked: boolean; // Whether panel is in fullscreen docked mode
  };
}

const defaultPanelLayout: PanelLayoutState = {
  sidebar: { visible: true, isDocked: false },
  narrativeEditor: { visible: true, isDocked: false },
  storyletEditor: { visible: true, isDocked: false },
};

export interface ModalState {
  isPlayModalOpen: boolean;
  isYarnModalOpen: boolean;
  isFlagModalOpen: boolean;
  isGuideOpen: boolean;
}

const defaultModalState: ModalState = {
  isPlayModalOpen: false,
  isYarnModalOpen: false,
  isFlagModalOpen: false,
  isGuideOpen: false,
};

export interface ViewStateSlice {
  graphScope: "narrative" | "storylet"
  storyletFocusId: string | null
  pendingFocusByScope: {
    narrative?: { graphId: string; nodeId?: string }
    storylet?: { graphId: string; nodeId?: string }
  }
  panelLayout: PanelLayoutState
  focusedEditor: "narrative" | "storylet" | null
  modalState: ModalState
}

export interface ViewStateActions {
  setGraphScope: (scope: "narrative" | "storylet") => void
  setStoryletFocusId: (id: string | null) => void
  requestFocus: (scope: "narrative" | "storylet", graphId: string, nodeId?: string) => void
  clearFocus: (scope: "narrative" | "storylet") => void
  togglePanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor') => void
  dockPanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor') => void
  undockPanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor') => void
  setFocusedEditor: (editor: "narrative" | "storylet" | null) => void
  openPlayModal: () => void
  closePlayModal: () => void
  openYarnModal: () => void
  closeYarnModal: () => void
  openFlagModal: () => void
  closeFlagModal: () => void
  openGuide: () => void
  closeGuide: () => void
}

export function createViewStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    graphScope: "narrative",
    storyletFocusId: null,
    pendingFocusByScope: {},
    panelLayout: defaultPanelLayout,
    focusedEditor: null,
    modalState: defaultModalState,
    setGraphScope: scope => set({ graphScope: scope }),
    setStoryletFocusId: id => set({ storyletFocusId: id }),
    requestFocus: (scope, graphId, nodeId) => {
      set((state) => ({
        pendingFocusByScope: {
          ...state.pendingFocusByScope,
          [scope]: { graphId, nodeId },
        },
      }))
    },
    clearFocus: (scope) => {
      set((state) => {
        const next = { ...state.pendingFocusByScope }
        delete next[scope]
        return { pendingFocusByScope: next }
      })
    },
    togglePanel: (panel) => {
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            visible: !state.panelLayout[panel].visible,
          },
        },
      }))
    },
    dockPanel: (panel) => {
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            isDocked: true,
          },
        },
      }))
    },
    undockPanel: (panel) => {
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            isDocked: false,
          },
        },
      }))
    },
    setFocusedEditor: (editor) => set({ focusedEditor: editor }),
    openPlayModal: () => set((state) => ({
      modalState: { ...state.modalState, isPlayModalOpen: true }
    })),
    closePlayModal: () => set((state) => ({
      modalState: { ...state.modalState, isPlayModalOpen: false }
    })),
    openYarnModal: () => set((state) => ({
      modalState: { ...state.modalState, isYarnModalOpen: true }
    })),
    closeYarnModal: () => set((state) => ({
      modalState: { ...state.modalState, isYarnModalOpen: false }
    })),
    openFlagModal: () => set((state) => ({
      modalState: { ...state.modalState, isFlagModalOpen: true }
    })),
    closeFlagModal: () => set((state) => ({
      modalState: { ...state.modalState, isFlagModalOpen: false }
    })),
    openGuide: () => set((state) => ({
      modalState: { ...state.modalState, isGuideOpen: true }
    })),
    closeGuide: () => set((state) => ({
      modalState: { ...state.modalState, isGuideOpen: false }
    })),
  }
}
