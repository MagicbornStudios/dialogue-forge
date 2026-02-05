import type { StateCreator } from 'zustand';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { WriterWorkspaceState } from '../writer-workspace-types';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';

export interface EditorSlice {
  editorError: string | null;
}

export interface EditorActions {
  saveNow: (pageId?: number, content?: { serialized: string; plainText?: string }) => Promise<void>;
  setEditorError: (error: string | null) => void;
}

/**
 * Editor is ephemeral: no draft state in the writer workspace.
 * saveNow(pageId, content) persists content to the page and updates the store.
 * When content is omitted (e.g. Cmd+S from outside editor), no-op unless content is provided by caller.
 */
export function createEditorSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  getDataAdapter?: () => WriterDataAdapter | null
): EditorSlice & EditorActions {
  return {
    editorError: null,
    saveNow: async (itemId, content) => {
      const targetId = itemId ?? get().activePageId;
      if (!targetId || !content?.serialized) {
        return;
      }
      const dataAdapter = getDataAdapter?.() ?? null;
      if (!dataAdapter) {
        return;
      }
      try {
        await dataAdapter.updatePage(targetId, {
          bookBody: content.serialized,
        });
      } catch (error) {
        console.error('Failed to persist page to Payload:', error);
        set({ editorError: 'Failed to save to server' });
        return;
      }
      set({ editorError: null });
      const nextPages = get().pages.map((page) =>
        page.id === targetId ? { ...page, bookBody: content.serialized } : page
      );
      const nextPageMap = new Map<number, ForgePage>();
      for (const page of nextPages) {
        nextPageMap.set(page.id, page);
      }
      set({ pages: nextPages, pageMap: nextPageMap });
    },
    setEditorError: (error) => set({ editorError: error }),
  };
}
