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

const defaultModalState: WriterModalState = {
  isYarnModalOpen: false,
  isPlayModalOpen: false,
  isSettingsModalOpen: false,
};

export interface ViewStateSlice {
  modalState: WriterModalState;
  panelLayout: WriterPanelLayoutState;
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
}

export function createViewStateSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    modalState: defaultModalState,
    panelLayout: defaultPanelLayout,
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
  };
}
