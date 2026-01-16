import React, { useMemo, useState, useEffect } from 'react';
import { Book, BookOpen, FileText, Plus, Search } from 'lucide-react';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { WriterTreeRow } from './WriterTreeRow';

interface WriterTreeProps {
  className?: string;
}

export function WriterTree({ className }: WriterTreeProps) {
  const acts = useWriterWorkspaceStore((state) => state.acts);
  const chapters = useWriterWorkspaceStore((state) => state.chapters);
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const setPages = useWriterWorkspaceStore((state) => state.actions.setPages);

  const [expandedActIds, setExpandedActIds] = useState<Set<number>>(() => new Set());
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<number>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const sortedActs = useMemo(
    () => [...acts].sort((a, b) => a.order - b.order),
    [acts]
  );

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.order - b.order),
    [chapters]
  );

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => a.order - b.order),
    [pages]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const matchesQuery = (value: string) => value.toLowerCase().includes(normalizedQuery);
  const hasSearchMatches = isSearching
    ? sortedActs.some((act) => matchesQuery(act.title)) ||
      sortedChapters.some((chapter) => matchesQuery(chapter.title)) ||
      sortedPages.some((page) => matchesQuery(page.title))
    : true;

  useEffect(() => {
    if (sortedActs.length > 0 && expandedActIds.size === 0) {
      setExpandedActIds(new Set(sortedActs.map((act) => act.id)));
    }
  }, [sortedActs, expandedActIds.size]);

  useEffect(() => {
    if (sortedChapters.length > 0 && expandedChapterIds.size === 0) {
      setExpandedChapterIds(new Set(sortedChapters.map((chapter) => chapter.id)));
    }
  }, [sortedChapters, expandedChapterIds.size]);

  useEffect(() => {
    if (!activePageId) {
      return;
    }

    const page = pages.find((item) => item.id === activePageId);
    if (!page) {
      return;
    }

    const chapter = chapters.find((item) => item.id === page.chapter);
    if (!chapter) {
      return;
    }

    const act = acts.find((item) => item.id === chapter.act);
    if (!act) {
      return;
    }

    setExpandedActIds((prev) => new Set(prev).add(act.id));
    setExpandedChapterIds((prev) => new Set(prev).add(chapter.id));
  }, [activePageId, acts, chapters, pages]);

  const toggleAct = (actId: number) => {
    setExpandedActIds((prev) => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleCreatePage = async () => {
    if (!dataAdapter?.createPage || isCreating) {
      return;
    }
    const activePage = pages.find((page) => page.id === activePageId) ?? null;
    const targetChapter =
      chapters.find((chapter) => chapter.id === activePage?.chapter) ??
      sortedChapters[0] ??
      null;
    if (!targetChapter) {
      return;
    }
    const chapterPages = sortedPages.filter((page) => page.chapter === targetChapter.id);
    const nextOrder =
      chapterPages.length > 0
        ? Math.max(...chapterPages.map((page) => page.order)) + 1
        : 1;

    setIsCreating(true);
    try {
      const newPage = await dataAdapter.createPage({
        title: 'New page',
        project: targetChapter.project,
        chapter: targetChapter.id,
        order: nextOrder,
        bookBody: '',
      });
      setPages([...pages, newPage]);
      setActivePageId(newPage.id);
      setExpandedChapterIds((prev) => new Set(prev).add(targetChapter.id));
      if (targetChapter.act) {
        setExpandedActIds((prev) => new Set(prev).add(targetChapter.act));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const canCreatePage = Boolean(dataAdapter?.createPage && chapters.length > 0);

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-2 ${className ?? ''}`}>
      <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-df-text-tertiary">
            Narrative Outline
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary transition hover:text-df-text-primary disabled:opacity-50"
            onClick={() => void handleCreatePage()}
            disabled={!canCreatePage || isCreating}
          >
            <Plus size={12} />
            New page
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-xs text-df-text-secondary">
          <Search size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search acts, chapters, pages..."
            className="w-full bg-transparent text-xs text-df-text-primary outline-none placeholder:text-df-text-tertiary"
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-df-node-border bg-df-editor-bg p-2">
        {sortedActs.length === 0 ? (
          <div className="rounded-md border border-df-control-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
            No acts available.
          </div>
        ) : (
          sortedActs
            .filter((act) => {
              if (!isSearching) {
                return true;
              }
              if (matchesQuery(act.title)) {
                return true;
              }
              const actChapters = sortedChapters.filter((chapter) => chapter.act === act.id);
              return actChapters.some((chapter) => {
                if (matchesQuery(chapter.title)) {
                  return true;
                }
                return sortedPages.some(
                  (page) => page.chapter === chapter.id && matchesQuery(page.title)
                );
              });
            })
            .map((act) => {
              const actChapters = sortedChapters.filter((chapter) => chapter.act === act.id);
              const actMatches = isSearching && matchesQuery(act.title);
              const visibleChapters = actMatches
                ? actChapters
                : actChapters.filter((chapter) => {
                    if (!isSearching) {
                      return true;
                    }
                    if (matchesQuery(chapter.title)) {
                      return true;
                    }
                    return sortedPages.some(
                      (page) => page.chapter === chapter.id && matchesQuery(page.title)
                    );
                  });
              const isActExpanded = isSearching || expandedActIds.has(act.id);

              return (
                <div key={act.id} className="space-y-1">
                  <WriterTreeRow
                    label={act.title}
                    depth={0}
                    icon={<BookOpen size={14} />}
                    hasChildren={actChapters.length > 0}
                    isExpanded={isActExpanded}
                    onToggle={() => toggleAct(act.id)}
                    onSelect={() => toggleAct(act.id)}
                  />

                  {isActExpanded &&
                    visibleChapters.map((chapter) => {
                      const chapterPages = sortedPages.filter(
                        (page) => page.chapter === chapter.id
                      );
                      const chapterMatches =
                        actMatches || (isSearching && matchesQuery(chapter.title));
                      const visiblePages = chapterMatches
                        ? chapterPages
                        : chapterPages.filter((page) => matchesQuery(page.title));
                      const isChapterExpanded = isSearching || expandedChapterIds.has(chapter.id);

                      return (
                        <div key={chapter.id} className="space-y-1">
                          <WriterTreeRow
                            label={chapter.title}
                            depth={1}
                            icon={<Book size={14} />}
                            hasChildren={chapterPages.length > 0}
                            isExpanded={isChapterExpanded}
                            onToggle={() => toggleChapter(chapter.id)}
                            onSelect={() => toggleChapter(chapter.id)}
                          />

                          {isChapterExpanded &&
                            visiblePages.map((page) => (
                              <WriterTreeRow
                                key={page.id}
                                label={page.title}
                                depth={2}
                                icon={<FileText size={14} />}
                                isSelected={activePageId === page.id}
                                onSelect={() => setActivePageId(page.id)}
                              />
                            ))}
                        </div>
                      );
                    })}
                </div>
              );
            })
        )}
        {isSearching && sortedActs.length > 0 && !hasSearchMatches && (
          <div className="rounded-md border border-df-control-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
            No matching pages found.
          </div>
        )}
      </div>
    </div>
  );
}
