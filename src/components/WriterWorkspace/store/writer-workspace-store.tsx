"use client";

import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ForgeAct, ForgeChapter, ForgePage } from '@/src/types/narrative';

export interface WriterWorkspaceState {
  acts: ForgeAct[];
  chapters: ForgeChapter[];
  pages: ForgePage[];
  activePageId: number | null;
  drafts: Record<number, WriterDraftState>;
  actions: {
    setActs: (acts: ForgeAct[]) => void;
    setChapters: (chapters: ForgeChapter[]) => void;
    setPages: (pages: ForgePage[]) => void;
    setActivePageId: (pageId: number | null) => void;
    updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
    setDraftTitle: (pageId: number, title: string) => void;
    setDraftContent: (pageId: number, content: string) => void;
    saveNow: (pageId?: number) => Promise<void>;
  };
}

export interface CreateWriterWorkspaceStoreOptions {
  initialActs?: ForgeAct[];
  initialChapters?: ForgeChapter[];
  initialPages?: ForgePage[];
  initialActivePageId?: number | null;
}

export const WRITER_SAVE_STATUS = {
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
} as const;

export type WriterSaveStatus =
  (typeof WRITER_SAVE_STATUS)[keyof typeof WRITER_SAVE_STATUS];

export type WriterDraftState = {
  title: string;
  content: string;
  status: WriterSaveStatus;
  error: string | null;
  revision: number;
};

const createDraftFromPage = (page: ForgePage): WriterDraftState => ({
  title: page.title,
  content: page.bookBody ?? '',
  status: WRITER_SAVE_STATUS.SAVED,
  error: null,
  revision: 0,
});

export function createWriterWorkspaceStore(options: CreateWriterWorkspaceStoreOptions) {
  const {
    initialActs = [],
    initialChapters = [],
    initialPages = [],
    initialActivePageId = null,
  } = options;

  return createStore<WriterWorkspaceState>()(
    devtools((set, get) => ({
      acts: initialActs,
      chapters: initialChapters,
      pages: initialPages,
      activePageId: initialActivePageId,
      drafts: Object.fromEntries(
        initialPages.map((page) => [page.id, createDraftFromPage(page)])
      ),
      actions: {
        setActs: (acts) => set({ acts }),
        setChapters: (chapters) => set({ chapters }),
        setPages: (pages) =>
          set((state) => {
            const nextDrafts = { ...state.drafts };
            pages.forEach((page) => {
              if (!nextDrafts[page.id]) {
                nextDrafts[page.id] = createDraftFromPage(page);
              }
            });
            return { pages, drafts: nextDrafts };
          }),
        setActivePageId: (pageId) =>
          set((state) => {
            if (!pageId) {
              return { activePageId: pageId };
            }
            if (state.drafts[pageId]) {
              return { activePageId: pageId };
            }
            const page = state.pages.find((entry) => entry.id === pageId);
            if (!page) {
              return { activePageId: pageId };
            }
            return {
              activePageId: pageId,
              drafts: {
                ...state.drafts,
                [pageId]: createDraftFromPage(page),
              },
            };
          }),
        updatePage: (pageId, patch) =>
          set((state) => ({
            pages: state.pages.map((page) =>
              page.id === pageId ? { ...page, ...patch } : page
            ),
          })),
        setDraftTitle: (pageId, title) =>
          set((state) => {
            const draft = state.drafts[pageId];
            if (!draft) {
              const page = state.pages.find((entry) => entry.id === pageId);
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
              const page = state.pages.find((entry) => entry.id === pageId);
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
        saveNow: async (pageId) => {
          const targetId = pageId ?? get().activePageId;
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
            const nextPages = state.pages.map((page) =>
              page.id === targetId
                ? { ...page, title: draft.title, bookBody: draft.content }
                : page
            );
            return {
              pages: nextPages,
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
      },
    }))
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
