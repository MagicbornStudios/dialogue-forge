import { createContext, useContext } from 'react';

interface CommentContextValue {
  pageId: number | null;
}

const CommentContext = createContext<CommentContextValue | null>(null);

export function CommentContextProvider({
  children,
  pageId,
}: {
  children: React.ReactNode;
  pageId: number | null;
}) {
  return (
    <CommentContext.Provider value={{ pageId }}>
      {children}
    </CommentContext.Provider>
  );
}

export function useCommentContext(): CommentContextValue {
  const context = useContext(CommentContext);
  if (!context) {
    return { pageId: null };
  }
  return context;
}
