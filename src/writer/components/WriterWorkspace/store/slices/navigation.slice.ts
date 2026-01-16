import type { StateCreator } from 'zustand';
import type { WriterWorkspaceState } from '../writer-workspace-types';
import { createWriterDraftContent, WRITER_SAVE_STATUS } from '../writer-workspace-types';

export interface NavigationSlice {
  activePageId: number | null;
  expandedActIds: Set<number>;
  expandedChapterIds: Set<number>;
  navigationError: string | null;
}

export interface NavigationActions {
  setActivePageId: (pageId: number | null) => void;
  toggleActExpanded: (actId: number) => void;
  toggleChapterExpanded: (chapterId: number) => void;
  setNavigationError: (error: string | null) => void;
}

export function createNavigationSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialActivePageId?: number | null
): NavigationSlice & NavigationActions {
  return {
    activePageId: initialActivePageId ?? null,
    expandedActIds: new Set<number>(),
    expandedChapterIds: new Set<number>(),
    navigationError: null,
    setActivePageId: (pageId) =>
      set((state) => {
        if (!pageId) {
          return { activePageId: pageId };
        }
        // Ensure draft exists for the page
        if (state.drafts[pageId]) {
          return { activePageId: pageId };
        }
        const page = state.pages.find((entry) => entry.id === pageId);
        if (!page) {
          return { activePageId: pageId };
        }
        // Create draft for page
        const draft = {
          title: page.title,
          content: createWriterDraftContent(page.bookBody),
          status: WRITER_SAVE_STATUS.SAVED,
          error: null,
          revision: 0,
        };
        return {
          activePageId: pageId,
          drafts: {
            ...state.drafts,
            [pageId]: draft,
          },
        };
      }),
    toggleActExpanded: (actId) =>
      set((state) => {
        const nextExpanded = new Set(state.expandedActIds);
        if (nextExpanded.has(actId)) {
          nextExpanded.delete(actId);
        } else {
          nextExpanded.add(actId);
        }
        return { expandedActIds: nextExpanded };
      }),
    toggleChapterExpanded: (chapterId) =>
      set((state) => {
        const nextExpanded = new Set(state.expandedChapterIds);
        if (nextExpanded.has(chapterId)) {
          nextExpanded.delete(chapterId);
        } else {
          nextExpanded.add(chapterId);
        }
        return { expandedChapterIds: nextExpanded };
      }),
    setNavigationError: (error) => set({ navigationError: error }),
  };
}
