import React, { useMemo } from 'react';
import { ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { PAGE_TYPE } from '@/forge/types/narrative';

export function WriterTopBar() {
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const drafts = useWriterWorkspaceStore((state) => state.drafts);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageLayout = useWriterWorkspaceStore((state) => state.pageLayout);
  const togglePageFullWidth = useWriterWorkspaceStore((state) => state.actions.togglePageFullWidth);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? null,
    [pages, activePageId]
  );

  // Build breadcrumb path by walking up the parent chain
  const breadcrumbPath = useMemo(() => {
    if (!activePage) return [];
    
    const path = [activePage];
    let current = activePage;
    
    // Walk up parent chain
    while (current.parent) {
      const parent = pages.find(p => p.id === current.parent);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return path;
  }, [activePage, pages]);
  
  const draftTitle = activePageId ? drafts[activePageId]?.title ?? '' : '';
  const pageTitle =
    draftTitle.trim() ||
    activePage?.title ||
    (activePageId ? 'Untitled' : 'Select a page');
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
      activePage.pageType
        ? { label: 'Type', value: activePage.pageType }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [activePage]);

  return (
    <div className="flex flex-col gap-2 px-4 py-3 mb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-df-text-tertiary">
            {breadcrumbPath.length > 0 ? (
              breadcrumbPath.map((page, index) => (
                <React.Fragment key={page.id}>
                  {index > 0 && <ChevronRight size={12} className="text-df-text-tertiary" />}
                  <button
                    type="button"
                    onClick={() => setActivePageId(page.id)}
                    className={`truncate transition-colors ${
                      page.id === activePageId
                        ? 'text-df-text-primary font-medium'
                        : 'hover:text-df-text-primary'
                    }`}
                  >
                    {page.title}
                  </button>
                </React.Fragment>
              ))
            ) : (
              <span className="text-df-text-tertiary">Workspace</span>
            )}
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
