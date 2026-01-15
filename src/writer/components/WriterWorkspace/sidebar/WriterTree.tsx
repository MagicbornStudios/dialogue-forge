import React, { useMemo, useState, useEffect } from 'react';
import { Book, BookOpen, FileText } from 'lucide-react';
import { useWriterWorkspaceStore } from '@/writer/components/store/writer-workspace-store';
import { WriterTreeRow } from './WriterTreeRow';

interface WriterTreeProps {
  className?: string;
}

export function WriterTree({ className }: WriterTreeProps) {
  const acts = useWriterWorkspaceStore((state) => state.acts);
  const chapters = useWriterWorkspaceStore((state) => state.chapters);
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);

  const [expandedActIds, setExpandedActIds] = useState<Set<number>>(() => new Set());
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<number>>(() => new Set());

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

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-2 ${className ?? ''}`}>
      <div className="rounded-lg border border-df-node-border bg-df-editor-bg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-df-text-tertiary">
        Narrative Outline
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-df-node-border bg-df-editor-bg p-2">
        {sortedActs.length === 0 ? (
          <div className="rounded-md border border-df-control-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
            No acts available.
          </div>
        ) : (
          sortedActs.map((act) => {
            const actChapters = sortedChapters.filter((chapter) => chapter.act === act.id);
            const isActExpanded = expandedActIds.has(act.id);

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
                  actChapters.map((chapter) => {
                    const chapterPages = sortedPages.filter(
                      (page) => page.chapter === chapter.id
                    );
                    const isChapterExpanded = expandedChapterIds.has(chapter.id);

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
                          chapterPages.map((page) => (
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
      </div>
    </div>
  );
}
