import type { StateCreator } from 'zustand';
import type { WriterWorkspaceState } from '../writer-workspace-types';

export interface NavigationSlice {
  activePageId: number | null;
  expandedPageIds: Set<number>;
  navigationError: string | null;
}

export interface NavigationActions {
  setActivePageId: (pageId: number | null) => void;
  togglePageExpanded: (pageId: number) => void;
  setNavigationError: (error: string | null) => void;
}

export function createNavigationSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialActivePageId?: number | null
): NavigationSlice & NavigationActions {
  return {
    activePageId: initialActivePageId ?? null,
    expandedPageIds: new Set<number>(),
    navigationError: null,
    setActivePageId: (pageId) => set({ activePageId: pageId }),
    togglePageExpanded: (pageId) =>
      set((state) => {
        const nextExpanded = new Set(state.expandedPageIds);
        if (nextExpanded.has(pageId)) {
          nextExpanded.delete(pageId);
        } else {
          nextExpanded.add(pageId);
        }
        return { expandedPageIds: nextExpanded };
      }),
    setNavigationError: (error) => set({ navigationError: error }),
  };
}
