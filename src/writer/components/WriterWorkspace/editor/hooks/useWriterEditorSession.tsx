// src/writer/components/WriterWorkspace/editor/hooks/useWriterEditorSession.tsx
import React, { createContext, useContext } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export interface WriterEditorSessionState {
  cursorPosition: { line: number; column: number } | null;
  selectedText: string | null;
  showAiPreview: boolean;
  editorTheme: 'light' | 'dark';
}

export function createWriterEditorSessionStore(initialState?: Partial<WriterEditorSessionState>) {
  return createStore<WriterEditorSessionState>()((set) => ({
    cursorPosition: null,
    selectedText: null,
    showAiPreview: true,
    editorTheme: 'dark',
    ...initialState,
  }));
}

export type WriterEditorSessionStore = ReturnType<typeof createWriterEditorSessionStore>;

const WriterEditorSessionContext = createContext<WriterEditorSessionStore | null>(null);

export function WriterEditorSessionProvider({
  store,
  children,
}: {
  store: WriterEditorSessionStore;
  children: React.ReactNode;
}) {
  return (
    <WriterEditorSessionContext.Provider value={store}>
      {children}
    </WriterEditorSessionContext.Provider>
  );
}

export function useWriterEditorSession<T>(
  selector: (state: WriterEditorSessionState) => T
): T {
  const store = useContext(WriterEditorSessionContext);
  if (!store) {
    throw new Error('useWriterEditorSession must be used within WriterEditorSessionProvider');
  }
  return useStore(store, selector);
}

export function useWriterEditorSessionStore(): WriterEditorSessionStore {
  const store = useContext(WriterEditorSessionContext);
  if (!store) {
    throw new Error('useWriterEditorSessionStore must be used within WriterEditorSessionProvider');
  }
  return store;
}
