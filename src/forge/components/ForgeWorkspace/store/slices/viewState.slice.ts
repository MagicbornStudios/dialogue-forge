import type { StateCreator } from "zustand"
import type { ForgeWorkspaceState } from "../forge-workspace-store"
import type { ForgeNodeType } from "@/forge/types/forge-graph"
import { debugStoreMutation } from "@/shared/utils/debug"

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
  nodeEditor: {
    visible: boolean;
    isDocked: boolean; // Whether panel is in fullscreen docked mode
  };
}

const defaultPanelLayout: PanelLayoutState = {
  sidebar: { visible: true, isDocked: false },
  narrativeEditor: { visible: true, isDocked: false },
  storyletEditor: { visible: true, isDocked: false },
  nodeEditor: { visible: false, isDocked: false },
};

export interface ModalState {
  isPlayModalOpen: boolean;
  isYarnModalOpen: boolean;
  isFlagModalOpen: boolean;
  isGuideOpen: boolean;
  isCopilotChatOpen: boolean;
}

const defaultModalState: ModalState = {
  isPlayModalOpen: false,
  isYarnModalOpen: false,
  isFlagModalOpen: false,
  isGuideOpen: false,
  isCopilotChatOpen: false,
};

export interface ViewStateSlice {
  graphScope: "narrative" | "storylet"
  storyletFocusId: string | null
  pendingFocusByScope: {
    narrative?: { graphId: string; nodeId?: string }
    storylet?: { graphId: string; nodeId?: string }
  }
  contextNodeTypeByScope: {
    narrative: ForgeNodeType | null
    storylet: ForgeNodeType | null
  }
  panelLayout: PanelLayoutState
  focusedEditor: "narrative" | "storylet" | null
  modalState: ModalState
  copilotVisible: boolean
}

export interface ViewStateActions {
  setGraphScope: (scope: "narrative" | "storylet") => void
  setStoryletFocusId: (id: string | null) => void
  requestFocus: (scope: "narrative" | "storylet", graphId: string, nodeId?: string) => void
  clearFocus: (scope: "narrative" | "storylet") => void
  setContextNodeType: (scope: "narrative" | "storylet", nodeType: ForgeNodeType | null) => void
  togglePanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor' | 'nodeEditor') => void
  dockPanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor' | 'nodeEditor') => void
  undockPanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor' | 'nodeEditor') => void
  setFocusedEditor: (editor: "narrative" | "storylet" | null) => void
  openPlayModal: () => void
  closePlayModal: () => void
  openYarnModal: () => void
  closeYarnModal: () => void
  openFlagModal: () => void
  closeFlagModal: () => void
  openGuide: () => void
  closeGuide: () => void
  openCopilotChat: () => void
  closeCopilotChat: () => void
  setCopilotVisible: (visible: boolean) => void
}

export function createViewStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    graphScope: "narrative",
    storyletFocusId: null,
    pendingFocusByScope: {},
    contextNodeTypeByScope: {
      narrative: null,
      storylet: null,
    },
    panelLayout: defaultPanelLayout,
    focusedEditor: null,
    modalState: defaultModalState,
    copilotVisible: true,
    setGraphScope: scope => set({ graphScope: scope }),
    setStoryletFocusId: id => set({ storyletFocusId: id }),
    requestFocus: (scope, graphId, nodeId) => {
      set((state) => {
        // Mutate the draft state directly (Immer pattern)
        state.pendingFocusByScope[scope] = { graphId, nodeId };
        debugStoreMutation('viewState', 'requestFocus', { scope, graphId, nodeId });
      })
    },
    clearFocus: (scope) => {
      set((state) => {
        // Mutate the draft state directly (Immer pattern)
        delete state.pendingFocusByScope[scope];
        debugStoreMutation('viewState', 'clearFocus', { scope });
      })
    },
    setContextNodeType: (scope, nodeType) => {
      set((state) => {
        // Mutate the draft state directly (Immer pattern)
        state.contextNodeTypeByScope[scope] = nodeType;
        debugStoreMutation('viewState', 'setContextNodeType', { scope, nodeType });
      })
    },
    togglePanel: (panel) => {
      set((state) => {
        // Mutate the draft state directly (Immer pattern)
        state.panelLayout[panel].visible = !state.panelLayout[panel].visible;
        debugStoreMutation('viewState', 'togglePanel', { panel });
      })
    },
    dockPanel: (panel) => {
      set((state) => {
        // When docking a panel, undock all others
        // Mutate the draft state directly (Immer pattern)
        state.panelLayout.sidebar.isDocked = panel === 'sidebar';
        state.panelLayout.narrativeEditor.isDocked = panel === 'narrativeEditor';
        state.panelLayout.storyletEditor.isDocked = panel === 'storyletEditor';
        state.panelLayout.nodeEditor.isDocked = panel === 'nodeEditor';
        
        // Ensure the docked panel is visible
        state.panelLayout[panel].isDocked = true;
        state.panelLayout[panel].visible = true;
        debugStoreMutation('viewState', 'dockPanel', { panel });
      })
    },
    undockPanel: (panel) => {
      set((state) => {
        // Mutate the draft state directly (Immer pattern)
        state.panelLayout[panel].isDocked = false;
        debugStoreMutation('viewState', 'undockPanel', { panel });
      })
    },
    setFocusedEditor: (editor) => {
      set((state) => {
        state.focusedEditor = editor;
        debugStoreMutation('viewState', 'setFocusedEditor', { editor });
      })
    },
    openPlayModal: () => {
      set((state) => {
        state.modalState.isPlayModalOpen = true;
        debugStoreMutation('viewState', 'openPlayModal');
      })
    },
    closePlayModal: () => {
      set((state) => {
        state.modalState.isPlayModalOpen = false;
        debugStoreMutation('viewState', 'closePlayModal');
      })
    },
    openYarnModal: () => {
      set((state) => {
        state.modalState.isYarnModalOpen = true;
        debugStoreMutation('viewState', 'openYarnModal');
      })
    },
    closeYarnModal: () => {
      set((state) => {
        state.modalState.isYarnModalOpen = false;
        debugStoreMutation('viewState', 'closeYarnModal');
      })
    },
    openFlagModal: () => {
      set((state) => {
        state.modalState.isFlagModalOpen = true;
        debugStoreMutation('viewState', 'openFlagModal');
      })
    },
    closeFlagModal: () => {
      set((state) => {
        state.modalState.isFlagModalOpen = false;
        debugStoreMutation('viewState', 'closeFlagModal');
      })
    },
    openGuide: () => {
      set((state) => {
        state.modalState.isGuideOpen = true;
        debugStoreMutation('viewState', 'openGuide');
      })
    },
    closeGuide: () => {
      set((state) => {
        state.modalState.isGuideOpen = false;
        debugStoreMutation('viewState', 'closeGuide');
      })
    },
    openCopilotChat: () => {
      set((state) => {
        state.modalState.isCopilotChatOpen = true;
        debugStoreMutation('viewState', 'openCopilotChat');
      })
    },
    closeCopilotChat: () => {
      set((state) => {
        state.modalState.isCopilotChatOpen = false;
        debugStoreMutation('viewState', 'closeCopilotChat');
      })
    },
    setCopilotVisible: (visible) => set({ copilotVisible: visible }),
  }
}
