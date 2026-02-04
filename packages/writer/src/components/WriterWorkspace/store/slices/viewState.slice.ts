import type { StateCreator } from 'zustand';
import type { WriterWorkspaceState } from '../writer-workspace-types';

export interface WriterPanelLayoutState {
  sidebar: {
    visible: boolean;
    isDocked: boolean;
  };
  editor: {
    visible: boolean;
    isDocked: boolean;
  };
}

const defaultPanelLayout: WriterPanelLayoutState = {
  sidebar: { visible: true, isDocked: false },
  editor: { visible: true, isDocked: false },
};

export interface WriterModalState {
  isYarnModalOpen: boolean;
  isPlayModalOpen: boolean;
  isSettingsModalOpen: boolean;
}

export interface WriterPageLayoutState {
  fullWidthByPageId: Record<number, boolean>;
}

const defaultModalState: WriterModalState = {
  isYarnModalOpen: false,
  isPlayModalOpen: false,
  isSettingsModalOpen: false,
};

const defaultPageLayout: WriterPageLayoutState = {
  fullWidthByPageId: {},
};

export interface ViewStateSlice {
  modalState: WriterModalState;
  panelLayout: WriterPanelLayoutState;
  pageLayout: WriterPageLayoutState;
  autosaveEnabled: boolean;
}

export interface ViewStateActions {
  openYarnModal: () => void;
  closeYarnModal: () => void;
  openPlayModal: () => void;
  closePlayModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  togglePanel: (panel: 'sidebar' | 'editor') => void;
  dockPanel: (panel: 'sidebar' | 'editor') => void;
  undockPanel: (panel: 'sidebar' | 'editor') => void;
  setPageFullWidth: (pageId: number, value: boolean) => void;
  togglePageFullWidth: (pageId: number) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
}

function getInitialAutosaveEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('writer-autosave-enabled');
  return saved !== null ? saved === 'true' : true;
}

export function createViewStateSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    modalState: defaultModalState,
    panelLayout: defaultPanelLayout,
    pageLayout: defaultPageLayout,
    autosaveEnabled: getInitialAutosaveEnabled(),
    openYarnModal: () =>
      set((state: WriterWorkspaceState) => {
        const currentModalState = (state.modalState as WriterModalState) ?? defaultModalState;
        return {
          modalState: { ...currentModalState, isYarnModalOpen: true },
        };
      }),
    closeYarnModal: () =>
      set((state: WriterWorkspaceState) => {
        const currentModalState = (state.modalState as WriterModalState) ?? defaultModalState;
        return {
          modalState: { ...currentModalState, isYarnModalOpen: false },
        };
      }),
    openPlayModal: () =>
      set((state: WriterWorkspaceState) => {
        const currentModalState = (state.modalState as WriterModalState) ?? defaultModalState;
        return {
          modalState: { ...currentModalState, isPlayModalOpen: true },
        };
      }),
    closePlayModal: () =>
      set((state: WriterWorkspaceState) => {
        const currentModalState = (state.modalState as WriterModalState) ?? defaultModalState;
        return {
          modalState: { ...currentModalState, isPlayModalOpen: false },
        };
      }),
    openSettingsModal: () =>
      set((state: WriterWorkspaceState) => {
        const currentModalState = (state.modalState as WriterModalState) ?? defaultModalState;
        return {
          modalState: { ...currentModalState, isSettingsModalOpen: true },
        };
      }),
    closeSettingsModal: () =>
      set((state: WriterWorkspaceState) => {
        const currentModalState = (state.modalState as WriterModalState) ?? defaultModalState;
        return {
          modalState: { ...currentModalState, isSettingsModalOpen: false },
        };
      }),
    togglePanel: (panel) =>
      set((state: WriterWorkspaceState) => {
        const currentPanelLayout = (state.panelLayout as WriterPanelLayoutState) ?? defaultPanelLayout;
        return {
          panelLayout: {
            ...currentPanelLayout,
            [panel]: {
              ...currentPanelLayout[panel],
              visible: !currentPanelLayout[panel].visible,
            },
          },
        };
      }),
    dockPanel: (panel) =>
      set((state: WriterWorkspaceState) => {
        const currentPanelLayout = (state.panelLayout as WriterPanelLayoutState) ?? defaultPanelLayout;
        return {
          panelLayout: {
            ...currentPanelLayout,
            [panel]: {
              ...currentPanelLayout[panel],
              isDocked: true,
            },
          },
        };
      }),
    undockPanel: (panel) =>
      set((state: WriterWorkspaceState) => {
        const currentPanelLayout = (state.panelLayout as WriterPanelLayoutState) ?? defaultPanelLayout;
        return {
          panelLayout: {
            ...currentPanelLayout,
            [panel]: {
              ...currentPanelLayout[panel],
              isDocked: false,
            },
          },
        };
      }),
    setPageFullWidth: (pageId, value) =>
      set((state: WriterWorkspaceState) => {
        const currentPageLayout = (state.pageLayout as WriterPageLayoutState) ?? defaultPageLayout;
        const currentFullWidth = currentPageLayout.fullWidthByPageId ?? {};
        return {
          pageLayout: {
            ...currentPageLayout,
            fullWidthByPageId: {
              ...currentFullWidth,
              [pageId]: value,
            },
          },
        };
      }),
    togglePageFullWidth: (pageId) =>
      set((state: WriterWorkspaceState) => {
        const currentPageLayout = (state.pageLayout as WriterPageLayoutState) ?? defaultPageLayout;
        const currentFullWidth = currentPageLayout.fullWidthByPageId ?? {};
        return {
          pageLayout: {
            ...currentPageLayout,
            fullWidthByPageId: {
              ...currentFullWidth,
              [pageId]: !currentFullWidth[pageId],
            },
          },
        };
      }),
    setAutosaveEnabled: (enabled) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('writer-autosave-enabled', String(enabled));
      }
      set({ autosaveEnabled: enabled });
    },
  };
}
