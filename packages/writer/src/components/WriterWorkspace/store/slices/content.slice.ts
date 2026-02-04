import type { StateCreator } from 'zustand';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { WriterWorkspaceState } from '../writer-workspace-types';

export interface ContentSlice {
  pages: ForgePage[];
  pageMap: Map<number, ForgePage>; // O(1) lookup map
  contentError: string | null;
}

export interface ContentActions {
  setPages: (pages: ForgePage[]) => void;
  updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
  setContentError: (error: string | null) => void;
}

export function createContentSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  _get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialPages?: ForgePage[]
): ContentSlice & ContentActions {
  // Build initial page map
  const buildPageMap = (pages: ForgePage[]): Map<number, ForgePage> => {
    const map = new Map<number, ForgePage>();
    for (const page of pages) {
      map.set(page.id, page);
    }
    return map;
  };

  return {
    pages: initialPages ?? [],
    pageMap: buildPageMap(initialPages ?? []),
    contentError: null,
    setPages: (pages) => set({ 
      pages,
      pageMap: buildPageMap(pages),
    }),
    updatePage: (pageId, patch) =>
      set((state) => {
        const updatedPages = state.pages.map((page) =>
          page.id === pageId ? { ...page, ...patch } : page
        );
        return {
          pages: updatedPages,
          pageMap: buildPageMap(updatedPages),
        };
      }),
    setContentError: (error) => set({ contentError: error }),
  };
}
