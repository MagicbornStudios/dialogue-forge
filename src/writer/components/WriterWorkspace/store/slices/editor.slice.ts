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
        console.log('[saveNow] No target page ID, skipping save');
        return;
      }
      
      const draft = get().drafts[targetId];
      if (!draft) {
        console.log('[saveNow] No draft found for page:', targetId);
        return;
      }
      
      // Skip if already saved and not dirty
      if (draft.status === WRITER_SAVE_STATUS.SAVED) {
        console.log('[saveNow] Page already saved, skipping:', targetId);
        return;
      }
      
      // Skip if already saving
      if (draft.status === WRITER_SAVE_STATUS.SAVING) {
        console.log('[saveNow] Page already saving, skipping:', targetId);
        return;
      }
      
      console.log('[saveNow] Starting save for page:', {
        pageId: targetId,
        status: draft.status,
        revision: draft.revision,
      });
      
      const startingRevision = draft.revision ?? 0;
      
      // Mark as saving
      set((state) => {
        const currentDraft = state.drafts[targetId];
        if (!currentDraft) {
          return state;
        }
        return {
          drafts: {
            ...state.drafts,
            [targetId]: {
              ...currentDraft,
              status: WRITER_SAVE_STATUS.SAVING,
              error: null,
            },
          },
        };
      });
      
      // Small delay to allow for rapid changes
      await Promise.resolve();
      
      // Check if content changed during the delay
      const currentDraft = get().drafts[targetId];
      if (!currentDraft || currentDraft.revision !== startingRevision) {
        // Content changed, mark as dirty and abort save
        set((state) => {
          const updatedDraft = state.drafts[targetId];
          if (!updatedDraft) {
            return state;
          }
          return {
            drafts: {
              ...state.drafts,
              [targetId]: {
                ...updatedDraft,
                status: WRITER_SAVE_STATUS.DIRTY,
              },
            },
          };
        });
        return;
      }
      
      // Update the page (works for all pageTypes: ACT, CHAPTER, PAGE)
      set((state) => {
        const nextPages = state.pages.map((page) =>
          page.id === targetId
            ? { ...page, title: currentDraft.title, bookBody: currentDraft.content.serialized }
            : page
        );
        // Rebuild pageMap to keep it in sync
        const nextPageMap = new Map<number, ForgePage>();
        for (const page of nextPages) {
          nextPageMap.set(page.id, page);
        }
        
        return {
          pages: nextPages,
          pageMap: nextPageMap,
        };
      });
      
      // Persist to Payload if dataAdapter is available
      const dataAdapter = get().dataAdapter;
      if (dataAdapter) {
        console.log('[saveNow] Saving page to database:', {
          pageId: targetId,
          title: currentDraft.title,
          contentLength: currentDraft.content.serialized?.length || 0,
          revision: startingRevision,
        });
        
        // Fire and forget - don't await to avoid blocking UI
        dataAdapter.updatePage(targetId, {
          title: currentDraft.title,
          bookBody: currentDraft.content.serialized,
        })
          .then(() => {
            console.log('[saveNow] Successfully saved page to database:', targetId);
            // Mark as saved on success
            set((state) => {
              const finalDraft = state.drafts[targetId];
              if (!finalDraft) {
                return state;
              }
              // Only mark as saved if revision hasn't changed
              if (finalDraft.revision === startingRevision) {
                return {
                  drafts: {
                    ...state.drafts,
                    [targetId]: {
                      ...finalDraft,
                      status: WRITER_SAVE_STATUS.SAVED,
                      error: null,
                    },
                  },
                };
              }
              // Revision changed, mark as dirty
              console.log('[saveNow] Content changed during save, marking as dirty:', targetId);
              return {
                drafts: {
                  ...state.drafts,
                  [targetId]: {
                    ...finalDraft,
                    status: WRITER_SAVE_STATUS.DIRTY,
                  },
                },
              };
            });
          })
          .catch((error) => {
            console.error('[saveNow] Failed to persist page to Payload:', {
              pageId: targetId,
              error,
            });
            // Mark as error if persistence fails
            set((state) => {
              const errorDraft = state.drafts[targetId];
              if (!errorDraft) {
                return state;
              }
              return {
                drafts: {
                  ...state.drafts,
                  [targetId]: {
                    ...errorDraft,
                    status: WRITER_SAVE_STATUS.ERROR,
                    error: 'Failed to save to server',
                  },
                },
              };
            });
          });
      } else {
        // No data adapter, just mark as saved locally
        set((state) => {
          const localDraft = state.drafts[targetId];
          if (!localDraft) {
            return state;
          }
          return {
            drafts: {
              ...state.drafts,
              [targetId]: {
                ...localDraft,
                status: WRITER_SAVE_STATUS.SAVED,
                error: null,
              },
            },
          };
        });
      }
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
