import { createContext, useContext } from 'react';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';

interface CommentContextValue {
  pageId: number | null;
  dataAdapter?: WriterDataAdapter;
}

const CommentContext = createContext<CommentContextValue | null>(null);

export function CommentContextProvider({
  children,
  pageId,
  dataAdapter,
}: {
  children: React.ReactNode;
  pageId: number | null;
  dataAdapter?: WriterDataAdapter;
}) {
  return (
    <CommentContext.Provider value={{ pageId, dataAdapter }}>
      {children}
    </CommentContext.Provider>
  );
}

export function useCommentContext(): CommentContextValue {
  const context = useContext(CommentContext);
  if (!context) {
    // Return default values if context is not available (for backward compatibility)
    return { pageId: null, dataAdapter: undefined };
  }
  return context;
}
