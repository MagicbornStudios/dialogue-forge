"use client";

import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import { createContentSlice } from './slices/content.slice';
import { createEditorSlice } from './slices/editor.slice';
import { createAiSlice } from './slices/ai.slice';
import { createNavigationSlice } from './slices/navigation.slice';
import { createViewStateSlice } from './slices/viewState.slice';
import type { EventSink } from '@/writer/events/writer-events';
import { createEvent } from '@/writer/events/events';
import { WRITER_EVENT_TYPE } from '@/writer/events/writer-events';
import type {
  WriterDraftState,
  WriterDraftContent,
  WriterSaveStatus,
  WriterAiProposalStatus,
  WriterAiPreviewMeta,
} from './writer-workspace-types';
import {
  WRITER_SAVE_STATUS,
  WRITER_AI_PROPOSAL_STATUS,
} from './writer-workspace-types';

// Re-export types for convenience
export type { WriterDocSnapshot, WriterPatchOp, WriterSelectionSnapshot } from '@/writer/types/writer-ai-types';
export type {
  WriterDraftState,
  WriterDraftContent,
  WriterSaveStatus,
  WriterAiProposalStatus,
  WriterAiPreviewMeta,
} from './writer-workspace-types';
export { WRITER_SAVE_STATUS, WRITER_AI_PROPOSAL_STATUS } from './writer-workspace-types';

export interface WriterWorkspaceState {
  // Content slice
  acts: ForgeAct[];
  chapters: ForgeChapter[];
  pages: ForgePage[];
  contentError: string | null;

  // Editor slice
  drafts: Record<number, WriterDraftState>;
  editorError: string | null;

  // AI slice
  aiPreview: import('@/writer/types/writer-ai-types').WriterPatchOp[] | null;
  aiPreviewMeta: WriterAiPreviewMeta | null;
  aiProposalStatus: WriterAiProposalStatus;
  aiError: string | null;
  aiSelection: import('@/writer/types/writer-ai-types').WriterSelectionSnapshot | null;
  aiSnapshot: import('@/writer/types/writer-ai-types').WriterDocSnapshot | null;
  aiUndoSnapshot: import('@/writer/types/writer-ai-types').WriterDocSnapshot | null;

  // Navigation slice
  activePageId: number | null;
  expandedActIds: Set<number>;
  expandedChapterIds: Set<number>;
  navigationError: string | null;

  // View state slice
  modalState: ReturnType<typeof createViewStateSlice>['modalState'];
  panelLayout: ReturnType<typeof createViewStateSlice>['panelLayout'];

  // Data adapter
  dataAdapter?: WriterDataAdapter;

  actions: {
    // Content actions
    setActs: (acts: ForgeAct[]) => void;
    setChapters: (chapters: ForgeChapter[]) => void;
    setPages: (pages: ForgePage[]) => void;
    updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
    setContentError: (error: string | null) => void;

    // Editor actions
    setDraftTitle: (pageId: number, title: string) => void;
    setDraftContent: (pageId: number, content: WriterDraftContent) => void;
    saveNow: (pageId?: number) => Promise<void>;
    createDraftForPage: (page: ForgePage) => void;
    setEditorError: (error: string | null) => void;

    // AI actions
    setAiSelection: (selection: import('@/writer/types/writer-ai-types').WriterSelectionSnapshot | null) => void;
            proposeAiEdits: (instruction?: string) => Promise<void>;
    applyAiEdits: () => void;
    revertAiDraft: () => void;

    // Navigation actions
    setActivePageId: (pageId: number | null) => void;
    toggleActExpanded: (actId: number) => void;
    toggleChapterExpanded: (chapterId: number) => void;
    setNavigationError: (error: string | null) => void;
  };
}

export interface CreateWriterWorkspaceStoreOptions {
  initialActs?: ForgeAct[];
  initialChapters?: ForgeChapter[];
  initialPages?: ForgePage[];
  initialActivePageId?: number | null;
  dataAdapter?: WriterDataAdapter;
}

export function createWriterWorkspaceStore(
  options: CreateWriterWorkspaceStoreOptions,
  eventSink: EventSink
) {
  const {
    initialActs = [],
    initialChapters = [],
    initialPages = [],
    initialActivePageId = null,
    dataAdapter,
  } = options;

  return createStore<WriterWorkspaceState>()(
    devtools(
      immer<WriterWorkspaceState>((set, get) => {
        // Type cast needed because Immer's set function signature differs from Zustand's
        // The slices expect Zustand's set signature, but Immer wraps it
        const setTyped = set as Parameters<typeof createContentSlice>[0];
        const getTyped = get as Parameters<typeof createContentSlice>[1];
        
        const contentSlice = createContentSlice(setTyped, getTyped, initialActs, initialChapters, initialPages);
        const editorSlice = createEditorSlice(setTyped, getTyped, initialPages);
        const aiSlice = createAiSlice(setTyped, getTyped);
        const navigationSlice = createNavigationSlice(setTyped, getTyped, initialActivePageId);
        const viewStateSlice = createViewStateSlice(setTyped, getTyped);

        // Wrap actions to emit events
        const setPagesWithEvents = (pages: ForgePage[]) => {
          contentSlice.setPages(pages);
          // Create drafts for new pages
          pages.forEach((page) => {
            if (!get().drafts[page.id]) {
              editorSlice.createDraftForPage(page);
            }
          });
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

        const saveNowWithEvents = async (pageId?: number) => {
          await editorSlice.saveNow(pageId);
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
          dataAdapter,
          actions: {
            // Content actions
            setActs: (acts) => {
              contentSlice.setActs(acts);
              eventSink.emit(
                createEvent(WRITER_EVENT_TYPE.CONTENT_CHANGE, { acts }, 'USER_ACTION')
              );
            },
            setChapters: (chapters) => {
              contentSlice.setChapters(chapters);
              eventSink.emit(
                createEvent(WRITER_EVENT_TYPE.CONTENT_CHANGE, { chapters }, 'USER_ACTION')
              );
            },
            setPages: setPagesWithEvents,
            updatePage: (pageId, patch) => {
              contentSlice.updatePage(pageId, patch);
              eventSink.emit(
                createEvent(WRITER_EVENT_TYPE.CONTENT_CHANGE, { pageId, patch }, 'USER_ACTION')
              );
            },
            setContentError: contentSlice.setContentError,

            // Editor actions
            setDraftTitle: editorSlice.setDraftTitle,
            setDraftContent: editorSlice.setDraftContent,
            saveNow: saveNowWithEvents,
            createDraftForPage: editorSlice.createDraftForPage,
            setEditorError: editorSlice.setEditorError,

            // AI actions
            setAiSelection: aiSlice.setAiSelection,
            proposeAiEdits: async (instruction?: string) => {
              await aiSlice.proposeAiEdits(instruction);
            },
            applyAiEdits: applyAiEditsWithEvents,
            revertAiDraft: aiSlice.revertAiDraft,

            // Navigation actions
            setActivePageId: setActivePageIdWithEvents,
            toggleActExpanded: navigationSlice.toggleActExpanded,
            toggleChapterExpanded: navigationSlice.toggleChapterExpanded,
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
