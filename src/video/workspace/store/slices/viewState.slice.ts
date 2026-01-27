import type { StateCreator } from 'zustand';
import type { VideoWorkspaceState } from '../video-workspace-store';

export type ModalType = 
  | 'preview'
  | 'export'
  | 'templatePicker'
  | 'settings'
  | null;

export interface PanelLayout {
  sidebar: { visible: boolean };
  canvas: { visible: boolean };
  timeline: { visible: boolean; isDocked: boolean };
  properties: { visible: boolean };
}

export interface ViewStateSlice {
  // Modal management
  activeModal: ModalType;
  modalData: Record<string, any>;
  
  // Panel layout
  panelLayout: PanelLayout;
  
  // Selection state
  selectedSceneId: string | null;
  selectedLayerId: string | null;
  selectedLayerIds: string[]; // Multi-select
  
  // Canvas view state
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  showGrid: boolean;
  gridSize: number;
  
  // Timeline view state
  timelineZoom: number;
  currentFrame: number;
  isPlaying: boolean;
}

export interface ViewStateActions {
  openModal: (modal: ModalType, data?: Record<string, any>) => void;
  closeModal: () => void;
  togglePanel: (panel: keyof PanelLayout) => void;
  setPanelVisibility: (panel: keyof PanelLayout, visible: boolean) => void;
  dockPanel: (panel: keyof PanelLayout, docked: boolean) => void;
  setSelectedSceneId: (id: string | null) => void;
  setSelectedLayerId: (id: string | null) => void;
  setSelectedLayerIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  setTimelineZoom: (zoom: number) => void;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

export function createViewStateSlice(
  set: Parameters<StateCreator<VideoWorkspaceState, [], [], VideoWorkspaceState>>[0],
  get: Parameters<StateCreator<VideoWorkspaceState, [], [], VideoWorkspaceState>>[1]
): ViewStateSlice & ViewStateActions {
  return {
    // Modal state
    activeModal: null,
    modalData: {},
    
    // Panel layout
    panelLayout: {
      sidebar: { visible: true },
      canvas: { visible: true },
      timeline: { visible: true, isDocked: false },
      properties: { visible: false }, // Hidden by default, shows when element selected
    },
    
    // Selection state
    selectedSceneId: null,
    selectedLayerId: null,
    selectedLayerIds: [],
    
    // Canvas view state
    canvasZoom: 1.0,
    canvasPan: { x: 0, y: 0 },
    showGrid: true,
    gridSize: 20,
    
    // Timeline view state
    timelineZoom: 1.0,
    currentFrame: 0,
    isPlaying: false,
    
    // Actions
    openModal: (modal: ModalType, data?: Record<string, any>) => {
      set({
        activeModal: modal,
        modalData: data || {},
      });
    },
    
    closeModal: () => {
      set({
        activeModal: null,
        modalData: {},
      });
    },
    
    togglePanel: (panel: keyof PanelLayout) => {
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            visible: !state.panelLayout[panel].visible,
          },
        },
      }));
    },
    
    setPanelVisibility: (panel: keyof PanelLayout, visible: boolean) => {
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            visible,
          },
        },
      }));
    },
    
    dockPanel: (panel: keyof PanelLayout, docked: boolean) => {
      set((state) => ({
        panelLayout: {
          ...state.panelLayout,
          [panel]: {
            ...state.panelLayout[panel],
            isDocked: docked,
          },
        },
      }));
    },
    
    setSelectedSceneId: (id: string | null) => {
      set({ selectedSceneId: id });
    },
    
    setSelectedLayerId: (id: string | null) => {
      set({ 
        selectedLayerId: id,
        selectedLayerIds: id ? [id] : [],
        // Show properties panel when layer selected
        panelLayout: {
          ...get().panelLayout,
          properties: { visible: id !== null },
        },
      });
    },
    
    setSelectedLayerIds: (ids: string[]) => {
      set({ 
        selectedLayerIds: ids,
        selectedLayerId: ids.length === 1 ? ids[0] : null,
        // Show properties panel when layers selected
        panelLayout: {
          ...get().panelLayout,
          properties: { visible: ids.length > 0 },
        },
      });
    },
    
    addToSelection: (id: string) => {
      const state = get();
      if (!state.selectedLayerIds.includes(id)) {
        set({ selectedLayerIds: [...state.selectedLayerIds, id] });
      }
    },
    
    removeFromSelection: (id: string) => {
      set((state) => ({
        selectedLayerIds: state.selectedLayerIds.filter((layerId) => layerId !== id),
      }));
    },
    
    clearSelection: () => {
      set({ 
        selectedLayerId: null,
        selectedLayerIds: [],
        // Hide properties panel when nothing selected
        panelLayout: {
          ...get().panelLayout,
          properties: { visible: false },
        },
      });
    },
    
    setCanvasZoom: (zoom: number) => {
      set({ canvasZoom: Math.max(0.1, Math.min(5.0, zoom)) });
    },
    
    setCanvasPan: (pan: { x: number; y: number }) => {
      set({ canvasPan: pan });
    },
    
    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }));
    },
    
    setGridSize: (size: number) => {
      set({ gridSize: Math.max(5, Math.min(100, size)) });
    },
    
    setTimelineZoom: (zoom: number) => {
      set({ timelineZoom: Math.max(0.1, Math.min(10.0, zoom)) });
    },
    
    setCurrentFrame: (frame: number) => {
      set({ currentFrame: Math.max(0, frame) });
    },
    
    setIsPlaying: (playing: boolean) => {
      set({ isPlaying: playing });
    },
  };
}