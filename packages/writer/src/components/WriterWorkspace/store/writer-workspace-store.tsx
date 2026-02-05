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
import type { DraftPendingPageCreation } from '@magicborn/shared/types/draft';
import { PAGE_TYPE } from '@magicborn/shared/types/narrative';
import { createWriterDraftSlice, type OnCommitWriterDraft } from './slices/draft.slice';
import type { WriterDraftDelta } from './slices/draft.slice';
import type { ForgeReactFlowNode } from '@magicborn/shared/types/forge-graph';

export function buildOnCommitWriterDraft(
  dataAdapter: WriterDataAdapter,
  forgeDataAdapter: WriterForgeDataAdapter
): OnCommitWriterDraft {
  return async (draft: ForgeGraphDoc, deltas: WriterDraftDelta[]) => {
    const pendingPageCreations = (deltas[deltas.length - 1]?.pendingPageCreations ?? []) as DraftPendingPageCreation[];
    const createdPages = new Map<string, ForgePage>();
    const pageTypeOrder = [PAGE_TYPE.ACT, PAGE_TYPE.CHAPTER, PAGE_TYPE.PAGE];
    for (const pageType of pageTypeOrder) {
      const creations = pendingPageCreations.filter((c) => c.pageType === pageType);
      for (const creation of creations) {
        const parentId = creation.parentPageId ?? (creation.parentNodeId ? createdPages.get(creation.parentNodeId)?.id ?? null : null);
        const page = await dataAdapter.createPage({
          projectId: creation.projectId,
          pageType: creation.pageType,
          title: creation.title,
          order: creation.order,
          parent: parentId ?? null,
        });
        createdPages.set(creation.nodeId, page);
      }
    }
    const nextDraft: ForgeGraphDoc = createdPages.size
      ? {
          ...draft,
          flow: {
            ...draft.flow,
            nodes: draft.flow.nodes.map((node: ForgeReactFlowNode) => {
              const createdPage = node.id ? createdPages.get(node.id) : undefined;
              if (!createdPage) return node;
              const nodeData = (node.data ?? {}) as Record<string, unknown>;
              return { ...node, data: { ...nodeData, pageId: createdPage.id } } as ForgeReactFlowNode;
            }),
          },
        }
      : draft;
    return forgeDataAdapter.updateGraph(nextDraft.id, {
      title: nextDraft.title,
      flow: nextDraft.flow,
      startNodeId: nextDraft.startNodeId,
      endNodeIds: nextDraft.endNodeIds,
      compiledYarn: nextDraft.compiledYarn ?? null,
    });
  };
}

/** Create a narrative graph via adapter. Exported for host/WriterWorkspace to build callbacks. */
export async function createNarrativeGraphWithAdapter(adapter: WriterForgeDataAdapter, projectId: number): Promise<ForgeGraphDoc> {
  const emptyGraph = createEmptyForgeGraphDoc({ projectId, kind: FORGE_GRAPH_KIND.NARRATIVE, title: 'Narrative Graph' });
  return adapter.createGraph({
    projectId,
    kind: FORGE_GRAPH_KIND.NARRATIVE,
    title: 'Narrative Graph',
    flow: emptyGraph.flow,
    startNodeId: emptyGraph.startNodeId,
    endNodeIds: emptyGraph.endNodeIds,
  });
}

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

/** Callbacks for persistence and loading. Host provides these (e.g. from RQ hooks). */
export interface WriterWorkspaceCallbacks {
  updatePage?: (pageId: number, patch: Partial<ForgePage>) => Promise<ForgePage>;
  createPage?: (input: {
    projectId: number;
    pageType: string;
    title: string;
    order: number;
    parent?: number | null;
    narrativeGraph?: number | null;
  }) => Promise<ForgePage>;
  getNarrativeGraph?: (id: number) => Promise<ForgeGraphDoc>;
  createNarrativeGraph?: (projectId: number) => Promise<ForgeGraphDoc>;
  onCommitWriterDraft?: OnCommitWriterDraft;
}

export interface CreateWriterWorkspaceStoreOptions {
  initialPages?: ForgePage[];
  initialActivePageId?: number | null;
  /** Callbacks for save/load. If omitted, corresponding actions no-op or throw. */
  callbacks?: WriterWorkspaceCallbacks;
  /** Optional getter for callbacks (e.g. from ref). When set, used at call time so callbacks can update after mount. */
  getCallbacks?: () => WriterWorkspaceCallbacks | null;
}

export function createWriterWorkspaceStore(
  options: CreateWriterWorkspaceStoreOptions,
  eventSink: EventSink
): StoreApi<WriterWorkspaceState> {
  const {
    initialPages = [],
    initialActivePageId = null,
    callbacks: staticCallbacks,
    getCallbacks,
  } = options;

  const resolveCallbacks = () => getCallbacks?.() ?? staticCallbacks ?? null;
  const updatePage = staticCallbacks?.updatePage ?? (getCallbacks ? (id: number, patch: Partial<ForgePage>) => resolveCallbacks()?.updatePage?.(id, patch) ?? Promise.reject(new Error('updatePage not available')) : undefined);
  const onCommitWriterDraft = staticCallbacks?.onCommitWriterDraft ?? (getCallbacks ? (draft: ForgeGraphDoc, deltas: WriterDraftDelta[]) => resolveCallbacks()?.onCommitWriterDraft?.(draft, deltas) ?? Promise.reject(new Error('onCommitWriterDraft not available')) : undefined);
  const createNarrativeGraphCallback = staticCallbacks?.createNarrativeGraph ?? (getCallbacks ? (projectId: number) => resolveCallbacks()?.createNarrativeGraph?.(projectId) ?? Promise.reject(new Error('createNarrativeGraph not available')) : undefined);

  return createStore<WriterWorkspaceState>()(
    devtools(
      immer<WriterWorkspaceState>((set, get) => {
        const setTyped = set as Parameters<typeof createContentSlice>[0];
        const getTyped = get as Parameters<typeof createContentSlice>[1];

        const contentSlice = createContentSlice(setTyped, getTyped, initialPages);
        const editorSlice = createEditorSlice(setTyped, getTyped, updatePage);
        const aiSlice = createAiSlice(setTyped, getTyped, updatePage);
        const navigationSlice = createNavigationSlice(setTyped, getTyped, initialActivePageId);
        const viewStateSlice = createViewStateSlice(setTyped, getTyped);
        const draftSlice = createWriterDraftSlice(setTyped, getTyped, undefined, onCommitWriterDraft);

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
              if (!createNarrativeGraphCallback) {
                throw new Error('createNarrativeGraph callback not available');
              }
              const graph = await createNarrativeGraphCallback(projectId);
              set((state) => ({
                narrativeGraphs: [...state.narrativeGraphs, graph],
                selectedNarrativeGraphId: graph.id,
              }));
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
