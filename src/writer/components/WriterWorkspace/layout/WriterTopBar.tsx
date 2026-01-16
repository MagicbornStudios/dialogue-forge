import React, { useMemo } from 'react';
import { ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

export function WriterTopBar() {
  const acts = useWriterWorkspaceStore((state) => state.acts);
  const chapters = useWriterWorkspaceStore((state) => state.chapters);
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const drafts = useWriterWorkspaceStore((state) => state.drafts);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageLayout = useWriterWorkspaceStore((state) => state.pageLayout);
  const togglePageFullWidth = useWriterWorkspaceStore((state) => state.actions.togglePageFullWidth);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? null,
    [pages, activePageId]
  );
  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === activePage?.chapter) ?? null,
    [chapters, activePage?.chapter]
  );
  const activeAct = useMemo(
    () => acts.find((act) => act.id === activeChapter?.act) ?? null,
    [acts, activeChapter?.act]
  );
  const draftTitle = activePageId ? drafts[activePageId]?.title ?? '' : '';
  const pageTitle =
    draftTitle.trim() ||
    activePage?.title ||
    (activePageId ? 'Untitled page' : 'Select a page');
  const isFullWidth = activePageId
    ? pageLayout.fullWidthByPageId[activePageId] ?? false
    : false;

  const metadata = useMemo(() => {
    if (!activePage) {
      return [];
    }
    return [
      activePage._status
        ? { label: 'Status', value: activePage._status }
        : null,
      activePage.summary
        ? { label: 'Summary', value: activePage.summary }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [activePage]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-df-text-tertiary">
            {activeAct ? (
              <span className="truncate">{activeAct.title}</span>
            ) : (
              <span className="text-df-text-tertiary">Workspace</span>
            )}
            {activeChapter ? (
              <>
                <ChevronRight size={12} className="text-df-text-tertiary" />
                <span className="truncate">{activeChapter.title}</span>
              </>
            ) : null}
            {activePage ? (
              <>
                <ChevronRight size={12} className="text-df-text-tertiary" />
                <span className="truncate">{activePage.title}</span>
              </>
            ) : null}
          </nav>
          <div className="mt-1 text-base font-semibold text-df-text-primary">
            {pageTitle}
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-df-control-border bg-df-control-bg px-3 py-1 text-xs text-df-text-secondary transition hover:text-df-text-primary disabled:opacity-50"
          onClick={() => {
            if (activePageId) {
              togglePageFullWidth(activePageId);
            }
          }}
          disabled={!activePageId}
          aria-pressed={isFullWidth}
        >
          {isFullWidth ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          Full width
        </button>
      </div>
      {metadata.length > 0 ? (
        <div className="flex flex-wrap gap-3 text-xs text-df-text-tertiary">
          {metadata.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
                {item.label}
              </span>
              <span className="text-df-text-secondary">{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
