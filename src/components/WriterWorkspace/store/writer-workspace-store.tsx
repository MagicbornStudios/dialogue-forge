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
  actions: {
    setActs: (acts: ForgeAct[]) => void;
    setChapters: (chapters: ForgeChapter[]) => void;
    setPages: (pages: ForgePage[]) => void;
    setActivePageId: (pageId: number | null) => void;
    updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
  };
}

export interface CreateWriterWorkspaceStoreOptions {
  initialActs?: ForgeAct[];
  initialChapters?: ForgeChapter[];
  initialPages?: ForgePage[];
  initialActivePageId?: number | null;
}

export function createWriterWorkspaceStore(options: CreateWriterWorkspaceStoreOptions) {
  const {
    initialActs = [],
    initialChapters = [],
    initialPages = [],
    initialActivePageId = null,
  } = options;

  return createStore<WriterWorkspaceState>()(
    devtools((set) => ({
      acts: initialActs,
      chapters: initialChapters,
      pages: initialPages,
      activePageId: initialActivePageId,
      actions: {
        setActs: (acts) => set({ acts }),
        setChapters: (chapters) => set({ chapters }),
        setPages: (pages) => set({ pages }),
        setActivePageId: (pageId) => set({ activePageId: pageId }),
        updatePage: (pageId, patch) =>
          set((state) => ({
            pages: state.pages.map((page) =>
              page.id === pageId ? { ...page, ...patch } : page
            ),
          })),
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
