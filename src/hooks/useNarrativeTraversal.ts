import { useCallback, useEffect, useMemo, useState } from 'react';

export interface NarrativeLocation {
  actIndex: number;
  chapterIndex: number;
  pageIndex: number;
}

export interface NarrativeProgress {
  actTitle: string;
  chapterTitle: string;
  pageIndex: number;
  pageCount: number;
  progress: number;
}

interface NarrativeTraversalOptions {
  title?: string;
  initialPageCount?: number;
}

export function useNarrativeTraversal({
  title,
  initialPageCount = 1,
}: NarrativeTraversalOptions) {
  const [location, setLocation] = useState<NarrativeLocation>({
    actIndex: 0,
    chapterIndex: 0,
    pageIndex: 0,
  });
  const [pageCount, setPageCount] = useState(Math.max(initialPageCount, 1));

  useEffect(() => {
    setPageCount(Math.max(initialPageCount, 1));
    setLocation({ actIndex: 0, chapterIndex: 0, pageIndex: 0 });
  }, [initialPageCount]);

  const goToPage = useCallback((pageIndex: number) => {
    setLocation(prev => ({
      ...prev,
      pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
    }));
  }, [pageCount]);

  const nextPage = useCallback(() => {
    setLocation(prev => ({
      ...prev,
      pageIndex: Math.min(prev.pageIndex + 1, Math.max(pageCount - 1, 0)),
    }));
  }, [pageCount]);

  const previousPage = useCallback(() => {
    setLocation(prev => ({
      ...prev,
      pageIndex: Math.max(prev.pageIndex - 1, 0),
    }));
  }, []);

  const syncPageCount = useCallback((count: number) => {
    setPageCount(Math.max(count, 1));
    setLocation(prev => ({
      ...prev,
      pageIndex: Math.min(prev.pageIndex, Math.max(count - 1, 0)),
    }));
  }, []);

  const progress = useMemo<NarrativeProgress>(() => {
    const safePageCount = Math.max(pageCount, 1);
    const currentPage = Math.min(location.pageIndex, safePageCount - 1);

    return {
      actTitle: `Act ${location.actIndex + 1}`,
      chapterTitle: title ? `${title} — Chapter ${location.chapterIndex + 1}` : `Chapter ${location.chapterIndex + 1}`,
      pageIndex: currentPage,
      pageCount: safePageCount,
      progress: (currentPage + 1) / safePageCount,
    };
  }, [location.actIndex, location.chapterIndex, location.pageIndex, pageCount, title]);

  return {
    location,
    progress,
    goToPage,
    nextPage,
    previousPage,
    setPageCount: syncPageCount,
  };
}
