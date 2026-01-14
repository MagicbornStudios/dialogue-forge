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

export interface ViewStateSlice {
  graphScope: "narrative" | "storylet"
  storyletFocusId: string | null
  pendingFocusByScope: {
    narrative?: { graphId: string; nodeId?: string }
    storylet?: { graphId: string; nodeId?: string }
  }
  panelLayout: PanelLayoutState
  focusedEditor: "narrative" | "storylet" | null
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
  }
}
