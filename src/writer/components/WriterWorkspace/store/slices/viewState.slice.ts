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
}

export function createViewStateSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    modalState: defaultModalState,
    panelLayout: defaultPanelLayout,
    pageLayout: defaultPageLayout,
    openYarnModal: () =>
      set((state) => ({
        modalState: { ...state.modalState, isYarnModalOpen: true },
      })),
    closeYarnModal: () =>
      set((state) => ({
        modalState: { ...state.modalState, isYarnModalOpen: false },
      })),
    openPlayModal: () =>
      set((state) => ({
        modalState: { ...state.modalState, isPlayModalOpen: true },
      })),
    closePlayModal: () =>
      set((state) => ({
        modalState: { ...state.modalState, isPlayModalOpen: false },
      })),
    openSettingsModal: () =>
      set((state) => ({
        modalState: { ...state.modalState, isSettingsModalOpen: true },
      })),
    closeSettingsModal: () =>
      set((state) => ({
        modalState: { ...state.modalState, isSettingsModalOpen: false },
      })),
    togglePanel: (panel) =>
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            visible: !state.panelLayout[panel].visible,
          },
        },
      })),
    dockPanel: (panel) =>
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            isDocked: true,
          },
        },
      })),
    undockPanel: (panel) =>
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            isDocked: false,
          },
        },
      })),
    setPageFullWidth: (pageId, value) =>
      set((state) => ({
        pageLayout: {
          ...state.pageLayout,
          fullWidthByPageId: {
            ...state.pageLayout.fullWidthByPageId,
            [pageId]: value,
          },
        },
      })),
    togglePageFullWidth: (pageId) =>
      set((state) => ({
        pageLayout: {
          ...state.pageLayout,
          fullWidthByPageId: {
            ...state.pageLayout.fullWidthByPageId,
            [pageId]: !state.pageLayout.fullWidthByPageId[pageId],
          },
        },
      })),
  };
}
