import type { StateCreator } from 'zustand';
import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';
import type { WriterWorkspaceState } from '../writer-workspace-types';

export interface ContentSlice {
  acts: ForgeAct[];
  chapters: ForgeChapter[];
  pages: ForgePage[];
  contentError: string | null;
}

export interface ContentActions {
  setActs: (acts: ForgeAct[]) => void;
  setChapters: (chapters: ForgeChapter[]) => void;
  setPages: (pages: ForgePage[]) => void;
  updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
  setContentError: (error: string | null) => void;
}

export function createContentSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialActs?: ForgeAct[],
  initialChapters?: ForgeChapter[],
  initialPages?: ForgePage[]
): ContentSlice & ContentActions {
  return {
    acts: initialActs ?? [],
    chapters: initialChapters ?? [],
    pages: initialPages ?? [],
    contentError: null,
    setActs: (acts) => set({ acts }),
    setChapters: (chapters) => set({ chapters }),
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
