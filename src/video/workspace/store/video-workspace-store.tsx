'use client';

import * as React from 'react';
import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter } from '@/video/workspace/video-template-workspace-contracts';
import { createTemplateSlice } from './slices/template.slice';
import { createViewStateSlice } from './slices/viewState.slice';
import { createProjectSlice } from './slices/project.slice';
import { createVideoDraftSlice } from './video-draft-slice';

export interface EventSink {
  emit(event: any): void;
}

export interface VideoWorkspaceState {
  // Template slice
  templates: ReturnType<typeof createTemplateSlice>['templates'];
  activeTemplateId: ReturnType<typeof createTemplateSlice>['activeTemplateId'];
  templateHistory: ReturnType<typeof createTemplateSlice>['templateHistory'];
  historyIndex: ReturnType<typeof createTemplateSlice>['historyIndex'];
  
  // Draft slice
  committedGraph: ReturnType<typeof createVideoDraftSlice>['committedGraph'];
  draftGraph: ReturnType<typeof createVideoDraftSlice>['draftGraph'];
  deltas: ReturnType<typeof createVideoDraftSlice>['deltas'];
  validation: ReturnType<typeof createVideoDraftSlice>['validation'];
  hasUncommittedChanges: ReturnType<typeof createVideoDraftSlice>['hasUncommittedChanges'];
  lastCommittedAt: ReturnType<typeof createVideoDraftSlice>['lastCommittedAt'];
  
  // View state slice
  activeModal: ReturnType<typeof createViewStateSlice>['activeModal'];
  modalData: ReturnType<typeof createViewStateSlice>['modalData'];
  panelLayout: ReturnType<typeof createViewStateSlice>['panelLayout'];
  overrideTab: ReturnType<typeof createViewStateSlice>['overrideTab'];
  isPreviewMode: ReturnType<typeof createViewStateSlice>['isPreviewMode'];
  selectedSceneId: ReturnType<typeof createViewStateSlice>['selectedSceneId'];
  selectedLayerId: ReturnType<typeof createViewStateSlice>['selectedLayerId'];
  selectedLayerIds: ReturnType<typeof createViewStateSlice>['selectedLayerIds'];
  canvasZoom: ReturnType<typeof createViewStateSlice>['canvasZoom'];
  canvasPan: ReturnType<typeof createViewStateSlice>['canvasPan'];
  showGrid: ReturnType<typeof createViewStateSlice>['showGrid'];
  gridSize: ReturnType<typeof createViewStateSlice>['gridSize'];
  timelineZoom: ReturnType<typeof createViewStateSlice>['timelineZoom'];
  currentFrame: ReturnType<typeof createViewStateSlice>['currentFrame'];
  isPlaying: ReturnType<typeof createViewStateSlice>['isPlaying'];
  
  // Project slice
  selectedProjectId: ReturnType<typeof createProjectSlice>['selectedProjectId'];
  
  // Adapter
  adapter?: VideoTemplateWorkspaceAdapter;
  
  // Event sink
  eventSink?: EventSink;
  
  // Actions
  actions: {
    // Template actions
    setTemplate: ReturnType<typeof createTemplateSlice>['setTemplate'];
    setTemplateStatus: ReturnType<typeof createTemplateSlice>['setTemplateStatus'];
    setActiveTemplateId: ReturnType<typeof createTemplateSlice>['setActiveTemplateId'];
    ensureTemplate: ReturnType<typeof createTemplateSlice>['ensureTemplate'];
    loadTemplate: ReturnType<typeof createTemplateSlice>['loadTemplate'];
    pushTemplateHistory: ReturnType<typeof createTemplateSlice>['pushTemplateHistory'];
    navigateBack: ReturnType<typeof createTemplateSlice>['navigateBack'];
    navigateForward: ReturnType<typeof createTemplateSlice>['navigateForward'];
    clearTemplateHistory: ReturnType<typeof createTemplateSlice>['clearTemplateHistory'];
    
    // Layer actions
    addLayer: ReturnType<typeof createTemplateSlice>['addLayer'];
    updateLayer: ReturnType<typeof createTemplateSlice>['updateLayer'];
    deleteLayer: ReturnType<typeof createTemplateSlice>['deleteLayer'];
    moveLayer: ReturnType<typeof createTemplateSlice>['moveLayer'];
    resizeLayer: ReturnType<typeof createTemplateSlice>['resizeLayer'];
    
    // Draft actions
    applyDelta: ReturnType<typeof createVideoDraftSlice>['applyDelta'];
    commitDraft: ReturnType<typeof createVideoDraftSlice>['commitDraft'];
    discardDraft: ReturnType<typeof createVideoDraftSlice>['discardDraft'];
    resetDraft: ReturnType<typeof createVideoDraftSlice>['resetDraft'];
    getDraftGraph: ReturnType<typeof createVideoDraftSlice>['getDraftGraph'];
    getCommittedGraph: ReturnType<typeof createVideoDraftSlice>['getCommittedGraph'];
    
    // View state actions
    openModal: ReturnType<typeof createViewStateSlice>['openModal'];
    closeModal: ReturnType<typeof createViewStateSlice>['closeModal'];
    togglePanel: ReturnType<typeof createViewStateSlice>['togglePanel'];
    setPanelVisibility: ReturnType<typeof createViewStateSlice>['setPanelVisibility'];
    dockPanel: ReturnType<typeof createViewStateSlice>['dockPanel'];
    setOverrideTab: ReturnType<typeof createViewStateSlice>['setOverrideTab'];
    setPreviewMode: ReturnType<typeof createViewStateSlice>['setPreviewMode'];
    setSelectedSceneId: ReturnType<typeof createViewStateSlice>['setSelectedSceneId'];
    setSelectedLayerId: ReturnType<typeof createViewStateSlice>['setSelectedLayerId'];
    setSelectedLayerIds: ReturnType<typeof createViewStateSlice>['setSelectedLayerIds'];
    addToSelection: ReturnType<typeof createViewStateSlice>['addToSelection'];
    removeFromSelection: ReturnType<typeof createViewStateSlice>['removeFromSelection'];
    clearSelection: ReturnType<typeof createViewStateSlice>['clearSelection'];
    setCanvasZoom: ReturnType<typeof createViewStateSlice>['setCanvasZoom'];
    setCanvasPan: ReturnType<typeof createViewStateSlice>['setCanvasPan'];
    toggleGrid: ReturnType<typeof createViewStateSlice>['toggleGrid'];
    setGridSize: ReturnType<typeof createViewStateSlice>['setGridSize'];
    setTimelineZoom: ReturnType<typeof createViewStateSlice>['setTimelineZoom'];
    setCurrentFrame: ReturnType<typeof createViewStateSlice>['setCurrentFrame'];
    setIsPlaying: ReturnType<typeof createViewStateSlice>['setIsPlaying'];
    
    // Project actions
    setSelectedProjectId: ReturnType<typeof createProjectSlice>['setSelectedProjectId'];
  };
}

export interface CreateVideoWorkspaceStoreOptions {
  initialTemplate?: VideoTemplate | null;
  initialTemplateId?: string | null;
  resolveTemplate?: (id: string) => Promise<VideoTemplate>;
  adapter?: VideoTemplateWorkspaceAdapter;
  selectedProjectId?: number | null;
}

export function createVideoWorkspaceStore(
  options: CreateVideoWorkspaceStoreOptions,
  eventSink: EventSink
): StoreApi<VideoWorkspaceState> {
  const {
    initialTemplate,
    initialTemplateId,
    resolveTemplate,
    adapter,
    selectedProjectId,
  } = options;

  const templateId = initialTemplateId ?? (initialTemplate ? initialTemplate.id : null);

  const store = createStore<VideoWorkspaceState>()(
    devtools(
      immer((set, get) => {
        // Create slices
        const templateSlice = createTemplateSlice(set, get, templateId, resolveTemplate);
        const draftSlice = createVideoDraftSlice(set, get, initialTemplate);
        const viewStateSlice = createViewStateSlice(set, get);
        const projectSlice = createProjectSlice(set, get, selectedProjectId);

        return {
          // Spread slice state
          ...templateSlice,
          ...draftSlice,
          ...viewStateSlice,
          ...projectSlice,
          
          // Adapter
          adapter,
          
          // Event sink
          eventSink,
          
          // Compose actions
          actions: {
            ...templateSlice,
            ...draftSlice,
            ...viewStateSlice,
            ...projectSlice,
          },
        };
      })
    )
  );

  // Initialize template cache AFTER store is created
  if (initialTemplate && templateId) {
    store.getState().actions.setTemplate(templateId, initialTemplate);
  }

  return store;
}

// Store context
const VideoWorkspaceStoreContext = createContext<StoreApi<VideoWorkspaceState> | null>(null);

export function VideoWorkspaceStoreProvider({
  children,
  store,
}: PropsWithChildren<{ store: StoreApi<VideoWorkspaceState> }>) {
  return (
    <VideoWorkspaceStoreContext.Provider value={store}>
      {children}
    </VideoWorkspaceStoreContext.Provider>
  );
}

export function useVideoWorkspaceStore(): StoreApi<VideoWorkspaceState>;
export function useVideoWorkspaceStore<T>(selector: (state: VideoWorkspaceState) => T): T;
export function useVideoWorkspaceStore<T>(selector?: (state: VideoWorkspaceState) => T) {
  const store = useContext(VideoWorkspaceStoreContext);
  if (!store) {
    throw new Error('useVideoWorkspaceStore must be used within VideoWorkspaceStoreProvider');
  }
  
  if (selector) {
    return useStore(store, selector);
  }
  
  return store;
}