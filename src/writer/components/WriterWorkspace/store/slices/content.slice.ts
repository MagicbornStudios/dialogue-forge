import type { StateCreator } from 'zustand';
import type { ForgePage } from '@/forge/types/narrative';
import type { WriterWorkspaceState } from '../writer-workspace-types';

export interface ContentSlice {
  pages: ForgePage[];
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
  return {
    pages: initialPages ?? [],
    contentError: null,
    setPages: (pages) => set({ pages }),
    updatePage: (pageId, patch) =>
      set((state) => ({
        pages: state.pages.map((page) =>
          page.id === pageId ? { ...page, ...patch } : page
        ),
      })),
    setContentError: (error) => set({ contentError: error }),
  };
}
