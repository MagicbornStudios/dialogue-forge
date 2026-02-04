import { createContext, useContext } from 'react';

interface EditorSyncContextValue {
  pageId: number | null;
  onContentChange: (pageId: number, content: { serialized: string; plainText: string }) => void;
  pageContent: string | null | undefined;
}

const EditorSyncContext = createContext<EditorSyncContextValue | null>(null);

export function EditorSyncContextProvider({
  children,
  pageId,
  onContentChange,
  pageContent,
}: {
  children: React.ReactNode;
  pageId: number | null;
  onContentChange: (pageId: number, content: { serialized: string; plainText: string }) => void;
  pageContent?: string | null | undefined;
}) {
  return (
    <EditorSyncContext.Provider value={{ pageId, onContentChange, pageContent: pageContent ?? null }}>
      {children}
    </EditorSyncContext.Provider>
  );
}

export function useEditorSyncContext(): EditorSyncContextValue {
  const context = useContext(EditorSyncContext);
  if (!context) {
    throw new Error('useEditorSyncContext must be used within EditorSyncContextProvider');
  }
  return context;
}
