"use client";

import * as React from 'react';
import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { ForgeGraphDoc } from '@magicborn/shared/types/forge-graph';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import type { NarrativeHierarchy } from '@magicborn/shared/types/narrative';
import { createContentSlice } from './slices/content.slice';
import { createEditorSlice } from './slices/editor.slice';
import { createAiSlice } from './slices/ai.slice';
import { createNavigationSlice } from './slices/navigation.slice';
import { createViewStateSlice } from './slices/viewState.slice';
import { createWriterDraftSlice } from './slices/draft.slice';
import type { EventSink } from '@magicborn/writer/events/writer-events';
import { createEvent } from '@magicborn/writer/events/events';
import { WRITER_EVENT_TYPE } from '@magicborn/writer/events/writer-events';
import type {
  WriterAiProposalStatus,
  WriterAiPreviewMeta,
} from './writer-workspace-types';
import {
  WRITER_SAVE_STATUS,
  WRITER_AI_PROPOSAL_STATUS,
} from './writer-workspace-types';
import type { WriterForgeDataAdapter } from '@magicborn/writer/types/forge-data-adapter';
import { createEmptyForgeGraphDoc } from '@magicborn/shared/utils/forge-graph-helpers';
import { FORGE_GRAPH_KIND } from '@magicborn/shared/types/forge-graph';

// Re-export types for convenience
export type { WriterDocSnapshot, WriterPatchOp, WriterSelectionSnapshot } from '@magicborn/writer/types/writer-ai-types';
export type {
  WriterSaveStatus,
  WriterAiProposalStatus,
  WriterAiPreviewMeta,
} from './writer-workspace-types';
export { WRITER_SAVE_STATUS, WRITER_AI_PROPOSAL_STATUS } from './writer-workspace-types';

export interface WriterWorkspaceState {
  // Unified content slice
  pages: ForgePage[];
  pageMap: Map<number, ForgePage>;
  contentError: string | null;

  // Editor slice (no drafts - editor is ephemeral, autosave to page)
  editorError: string | null;

  // AI slice
  aiPreview: import('@magicborn/writer/types/writer-ai-types').WriterPatchOp[] | null;
  aiPreviewMeta: WriterAiPreviewMeta | null;
  aiProposalStatus: WriterAiProposalStatus;
  aiError: string | null;
  aiSelection: import('@magicborn/writer/types/writer-ai-types').WriterSelectionSnapshot | null;
  aiSnapshot: import('@magicborn/writer/types/writer-ai-types').WriterDocSnapshot | null;
  aiUndoSnapshot: import('@magicborn/writer/types/writer-ai-types').WriterDocSnapshot | null;

  // Navigation slice - unified
  activePageId: number | null;
  expandedPageIds: Set<number>;
  navigationError: string | null;

  // View state slice
  modalState: ReturnType<typeof createViewStateSlice>['modalState'];
  panelLayout: ReturnType<typeof createViewStateSlice>['panelLayout'];
  pageLayout: ReturnType<typeof createViewStateSlice>['pageLayout'];
  autosaveEnabled: ReturnType<typeof createViewStateSlice>['autosaveEnabled'];

  // Narrative graph sync
  narrativeGraphs: ForgeGraphDoc[];
  selectedNarrativeGraphId: number | null;
  narrativeGraph: ForgeGraphDoc | null;
  narrativeHierarchy: NarrativeHierarchy | null;

  // Draft slice
  committedGraph: ReturnType<typeof createWriterDraftSlice>['committedGraph'];
  draftGraph: ReturnType<typeof createWriterDraftSlice>['draftGraph'];
  deltas: ReturnType<typeof createWriterDraftSlice>['deltas'];
  validation: ReturnType<typeof createWriterDraftSlice>['validation'];
  hasUncommittedChanges: ReturnType<typeof createWriterDraftSlice>['hasUncommittedChanges'];
  lastCommittedAt: ReturnType<typeof createWriterDraftSlice>['lastCommittedAt'];

  // Data adapters
  dataAdapter?: WriterDataAdapter;
  forgeDataAdapter?: WriterForgeDataAdapter;

  actions: {
    // Content actions
    setPages: (pages: ForgePage[]) => void;
    updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
    setContentError: (error: string | null) => void;

    // Editor actions
    saveNow: (pageId?: number, content?: { serialized: string; plainText?: string }) => Promise<void>;
    setEditorError: (error: string | null) => void;

    // AI actions
    setAiSelection: (selection: import('@magicborn/writer/types/writer-ai-types').WriterSelectionSnapshot | null) => void;
            proposeAiEdits: (instruction?: string) => Promise<void>;
    applyAiEdits: () => void;
    revertAiDraft: () => void;

    // Navigation actions - unified
    setActivePageId: (pageId: number | null) => void;
    togglePageExpanded: (pageId: number) => void;
    setNavigationError: (error: string | null) => void;

    // View state actions
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
    
    // Narrative graph actions
    setNarrativeGraphs: (graphs: ForgeGraphDoc[]) => void;
    setSelectedNarrativeGraphId: (graphId: number | null) => void;
    setNarrativeGraph: (graph: ForgeGraphDoc | null) => void;
    setNarrativeHierarchy: (hierarchy: NarrativeHierarchy | null) => void;
    createNarrativeGraph: (projectId: number) => Promise<ForgeGraphDoc>;

    // Draft actions
    applyDelta: ReturnType<typeof createWriterDraftSlice>['applyDelta'];
    commitDraft: ReturnType<typeof createWriterDraftSlice>['commitDraft'];
    discardDraft: ReturnType<typeof createWriterDraftSlice>['discardDraft'];
    resetDraft: ReturnType<typeof createWriterDraftSlice>['resetDraft'];
    getDraftGraph: ReturnType<typeof createWriterDraftSlice>['getDraftGraph'];
    getCommittedGraph: ReturnType<typeof createWriterDraftSlice>['getCommittedGraph'];
  };
}

export interface CreateWriterWorkspaceStoreOptions {
  initialPages?: ForgePage[];
  initialActivePageId?: number | null;
  dataAdapter?: WriterDataAdapter;
  forgeDataAdapter?: WriterForgeDataAdapter;
}

export function createWriterWorkspaceStore(
  options: CreateWriterWorkspaceStoreOptions,
  eventSink: EventSink
): StoreApi<WriterWorkspaceState> {
  const {
    initialPages = [],
    initialActivePageId = null,
    dataAdapter,
    forgeDataAdapter,
  } = options;

  return createStore<WriterWorkspaceState>()(
    devtools(
      immer<WriterWorkspaceState>((set, get) => {
        // Type cast needed because Immer's set function signature differs from Zustand's
        // The slices expect Zustand's set signature, but Immer wraps it
        const setTyped = set as Parameters<typeof createContentSlice>[0];
        const getTyped = get as Parameters<typeof createContentSlice>[1];
        
        const contentSlice = createContentSlice(setTyped, getTyped, initialPages);
        const editorSlice = createEditorSlice(setTyped, getTyped);
        const aiSlice = createAiSlice(setTyped, getTyped);
        const navigationSlice = createNavigationSlice(setTyped, getTyped, initialActivePageId);
        const viewStateSlice = createViewStateSlice(setTyped, getTyped);
        const draftSlice = createWriterDraftSlice(setTyped, getTyped);

        // Wrap actions to emit events
        const setPagesWithEvents = (pages: ForgePage[]) => {
          contentSlice.setPages(pages);
          eventSink.emit(
            createEvent(WRITER_EVENT_TYPE.CONTENT_CHANGE, { pages }, 'USER_ACTION')
          );
        };

        const setActivePageIdWithEvents = (pageId: number | null) => {
          navigationSlice.setActivePageId(pageId);
          eventSink.emit(
            createEvent(WRITER_EVENT_TYPE.NAVIGATION, { pageId }, 'USER_ACTION')
          );
        };

        const saveNowWithEvents = async (pageId?: number, content?: { serialized: string; plainText?: string }) => {
          await editorSlice.saveNow(pageId, content);
          const targetId = pageId ?? get().activePageId;
          if (targetId) {
            eventSink.emit(
              createEvent(WRITER_EVENT_TYPE.SAVE, { pageId: targetId }, 'USER_ACTION')
            );
          }
        };

        const applyAiEditsWithEvents = () => {
          aiSlice.applyAiEdits();
          eventSink.emit(
            createEvent(WRITER_EVENT_TYPE.AI_EDIT, { action: 'apply' }, 'USER_ACTION')
          );
        };

        return {
          ...contentSlice,
          ...editorSlice,
          ...aiSlice,
          ...navigationSlice,
          ...viewStateSlice,
          ...draftSlice,
          pageMap: contentSlice.pageMap, // Include pageMap from content slice
          narrativeGraphs: [],
          selectedNarrativeGraphId: null,
          narrativeGraph: null,
          narrativeHierarchy: null,
          dataAdapter,
          forgeDataAdapter,
          actions: {
            // Content actions
            setPages: setPagesWithEvents,
            updatePage: (pageId, patch) => {
              contentSlice.updatePage(pageId, patch);
              eventSink.emit(
                createEvent(WRITER_EVENT_TYPE.CONTENT_CHANGE, { pageId, patch }, 'USER_ACTION')
              );
            },
            setContentError: contentSlice.setContentError,
            setNarrativeGraphs: (graphs: ForgeGraphDoc[]) => set({ narrativeGraphs: graphs }),
            setSelectedNarrativeGraphId: (graphId: number | null) => set({ selectedNarrativeGraphId: graphId }),
            setNarrativeGraph: (graph: ForgeGraphDoc | null) => {
              set({ narrativeGraph: graph });
              draftSlice.resetDraft(graph ?? null);
            },
            setNarrativeHierarchy: (hierarchy: NarrativeHierarchy | null) => set({ narrativeHierarchy: hierarchy }),
            createNarrativeGraph: async (projectId: number) => {
              const adapter = get().forgeDataAdapter;
              if (!adapter) {
                throw new Error('ForgeDataAdapter not available');
              }
              
              const emptyGraph = createEmptyForgeGraphDoc({
                projectId,
                kind: FORGE_GRAPH_KIND.NARRATIVE,
                title: 'Narrative Graph',
              });
              
              const graph = await adapter.createGraph({
                projectId,
                kind: FORGE_GRAPH_KIND.NARRATIVE,
                title: 'Narrative Graph',
                flow: emptyGraph.flow,
                startNodeId: emptyGraph.startNodeId,
                endNodeIds: emptyGraph.endNodeIds,
              });
              
              // Add to graphs list and select it
              set((state) => ({
                narrativeGraphs: [...state.narrativeGraphs, graph],
                selectedNarrativeGraphId: graph.id,
              }));
              
              // Also set as the active narrative graph
              set({ narrativeGraph: graph });
              draftSlice.resetDraft(graph);
              
              return graph;
            },

            // Editor actions
            saveNow: saveNowWithEvents,
            setEditorError: editorSlice.setEditorError,

            // Draft actions
            applyDelta: draftSlice.applyDelta,
            commitDraft: async () => {
              await draftSlice.commitDraft();
              const committed = get().committedGraph;
              set({ narrativeGraph: committed ?? null });
            },
            discardDraft: async () => {
              await draftSlice.discardDraft();
              const committed = get().committedGraph;
              set({ narrativeGraph: committed ?? null });
            },
            resetDraft: (nextCommitted?: ForgeGraphDoc | null) => {
              draftSlice.resetDraft(nextCommitted ?? null);
              if (typeof nextCommitted !== 'undefined') {
                set({ narrativeGraph: nextCommitted ?? null });
              }
            },
            getDraftGraph: draftSlice.getDraftGraph,
            getCommittedGraph: draftSlice.getCommittedGraph,

            // AI actions
            setAiSelection: aiSlice.setAiSelection,
            proposeAiEdits: async (instruction?: string) => {
              await aiSlice.proposeAiEdits(instruction);
            },
            applyAiEdits: applyAiEditsWithEvents,
            revertAiDraft: aiSlice.revertAiDraft,

            // Navigation actions
            setActivePageId: setActivePageIdWithEvents,
            togglePageExpanded: navigationSlice.togglePageExpanded,
            setNavigationError: navigationSlice.setNavigationError,

            // View state actions
            openYarnModal: viewStateSlice.openYarnModal,
            closeYarnModal: viewStateSlice.closeYarnModal,
            openPlayModal: viewStateSlice.openPlayModal,
            closePlayModal: viewStateSlice.closePlayModal,
            openSettingsModal: viewStateSlice.openSettingsModal,
            closeSettingsModal: viewStateSlice.closeSettingsModal,
            togglePanel: viewStateSlice.togglePanel,
            dockPanel: viewStateSlice.dockPanel,
            undockPanel: viewStateSlice.undockPanel,
            setPageFullWidth: viewStateSlice.setPageFullWidth,
            togglePageFullWidth: viewStateSlice.togglePageFullWidth,
            setAutosaveEnabled: viewStateSlice.setAutosaveEnabled,
          },
        };
      }),
      { name: 'WriterWorkspaceStore' }
    )
  );
}

const WriterWorkspaceStoreContext = createContext<StoreApi<WriterWorkspaceState> | null>(null);

export function WriterWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: StoreApi<WriterWorkspaceState> }>) {
  return (
    <WriterWorkspaceStoreContext.Provider value={store}>
      {children}
    </WriterWorkspaceStoreContext.Provider>
  );
}

export function useWriterWorkspaceStore<T>(selector: (state: WriterWorkspaceState) => T): T {
  const store = useContext(WriterWorkspaceStoreContext);

  if (!store) {
    throw new Error('useWriterWorkspaceStore must be used within WriterWorkspaceStoreProvider');
  }

  return useStore(store, selector);
}
