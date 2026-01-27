import type { StateCreator } from 'zustand';
import type { ForgePage } from '@/shared/types/narrative';
import type { WriterWorkspaceState, WriterDraftState, WriterDraftContent } from '../writer-workspace-types';
import { createWriterDraftContent, WRITER_SAVE_STATUS } from '../writer-workspace-types';

const createDraftFromPage = (page: ForgePage): WriterDraftState => ({
  title: page.title,
  content: createWriterDraftContent(page.bookBody),
  status: WRITER_SAVE_STATUS.SAVED,
  error: null,
  revision: 0,
});

export interface EditorSlice {
  drafts: Record<number, WriterDraftState>;
  editorError: string | null;
}

export interface EditorActions {
  setDraftTitle: (pageId: number, title: string) => void;
  setDraftContent: (pageId: number, content: WriterDraftContent) => void;
  saveNow: (pageId?: number) => Promise<void>;
  createDraftForPage: (page: ForgePage) => void;
  setEditorError: (error: string | null) => void;
}

export function createEditorSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialPages?: ForgePage[]
): EditorSlice & EditorActions {
  return {
    drafts: Object.fromEntries(
      (initialPages ?? []).map((page) => [page.id, createDraftFromPage(page)])
    ),
    editorError: null,
    setDraftTitle: (pageId, title) =>
      set((state) => {
        const draft = state.drafts[pageId];
        if (!draft) {
          const page = state.pageMap.get(pageId);
          if (!page) {
            return state;
          }
          return {
            drafts: {
              ...state.drafts,
              [pageId]: {
                ...createDraftFromPage(page),
                title,
                status: WRITER_SAVE_STATUS.DIRTY,
                revision: 1,
              },
            },
          };
        }
        return {
          drafts: {
            ...state.drafts,
            [pageId]: {
              ...draft,
              title,
              status: WRITER_SAVE_STATUS.DIRTY,
              error: null,
              revision: draft.revision + 1,
            },
          },
        };
      }),
    setDraftContent: (pageId, content) =>
      set((state) => {
        const draft = state.drafts[pageId];
        if (!draft) {
          const page = state.pageMap.get(pageId);
          if (!page) {
            return state;
          }
          return {
            drafts: {
              ...state.drafts,
              [pageId]: {
                ...createDraftFromPage(page),
                content,
                status: WRITER_SAVE_STATUS.DIRTY,
                revision: 1,
              },
            },
          };
        }
        return {
          drafts: {
            ...state.drafts,
            [pageId]: {
              ...draft,
              content,
              status: WRITER_SAVE_STATUS.DIRTY,
              error: null,
              revision: draft.revision + 1,
            },
          },
        };
      }),
    saveNow: async (itemId) => {
      const targetId = itemId ?? get().activePageId;
      if (!targetId) {
        return;
      }
      const startingRevision = get().drafts[targetId]?.revision ?? 0;
      set((state) => {
        const draft = state.drafts[targetId];
        if (!draft || draft.status === WRITER_SAVE_STATUS.SAVING) {
          return state;
        }
        return {
          drafts: {
            ...state.drafts,
            [targetId]: {
              ...draft,
              status: WRITER_SAVE_STATUS.SAVING,
              error: null,
            },
          },
        };
      });
      await Promise.resolve();
      set((state) => {
        const draft = state.drafts[targetId];
        if (!draft) {
          return state;
        }
        if (draft.revision !== startingRevision) {
          return {
            drafts: {
              ...state.drafts,
              [targetId]: {
                ...draft,
                status: WRITER_SAVE_STATUS.DIRTY,
              },
            },
          };
        }
        // Update the page (works for all pageTypes: ACT, CHAPTER, PAGE)
        const nextPages = state.pages.map((page) =>
          page.id === targetId
            ? { ...page, title: draft.title, bookBody: draft.content.serialized }
            : page
        );
        // Rebuild pageMap to keep it in sync
        const nextPageMap = new Map<number, ForgePage>();
        for (const page of nextPages) {
          nextPageMap.set(page.id, page);
        }
        
        // Persist to Payload if dataAdapter is available
        const dataAdapter = get().dataAdapter;
        if (dataAdapter) {
          // Fire and forget - don't await to avoid blocking UI
          dataAdapter.updatePage(targetId, {
            title: draft.title,
            bookBody: draft.content.serialized,
          }).catch((error) => {
            console.error('Failed to persist page to Payload:', error);
            // Mark as error if persistence fails
            set((state) => {
              const currentDraft = state.drafts[targetId];
              if (currentDraft) {
                return {
                  drafts: {
                    ...state.drafts,
                    [targetId]: {
                      ...currentDraft,
                      status: WRITER_SAVE_STATUS.ERROR,
                      error: 'Failed to save to server',
                    },
                  },
                };
              }
              return state;
            });
          });
        }
        
        return {
          pages: nextPages,
          pageMap: nextPageMap,
          drafts: {
            ...state.drafts,
            [targetId]: {
              ...draft,
              status: WRITER_SAVE_STATUS.SAVED,
              error: null,
            },
          },
        };
      });
    },
    createDraftForPage: (page) =>
      set((state) => {
        if (state.drafts[page.id]) {
          return state;
        }
        return {
          drafts: {
            ...state.drafts,
            [page.id]: createDraftFromPage(page),
          },
        };
      }),
    setEditorError: (error) => set({ editorError: error }),
  };
}
