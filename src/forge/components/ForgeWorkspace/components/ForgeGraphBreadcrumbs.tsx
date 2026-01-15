import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';
import type { BreadcrumbItem } from '../store/slices/graph.slice';

interface ForgeGraphBreadcrumbsProps {
  scope: "narrative" | "storylet";
}

export function ForgeGraphBreadcrumbs({ scope }: ForgeGraphBreadcrumbsProps) {
  const breadcrumbHistory = useForgeWorkspaceStore((s) => s.breadcrumbHistoryByScope[scope]);
  const navigateToBreadcrumb = useForgeWorkspaceStore((s) => s.actions.navigateToBreadcrumb);
  const clearBreadcrumbs = useForgeWorkspaceStore((s) => s.actions.clearBreadcrumbs);

  // Always show home icon, even when no breadcrumbs exist
  if (breadcrumbHistory.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-df-text-secondary">
        <button
          onClick={() => clearBreadcrumbs(scope)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-df-control-bg transition-colors"
          title="Clear navigation history"
        >
          <Home size={14} />
        </button>
      </div>
    );
  }

  // Truncate if too long (show first, last 2, and "...")
  const maxVisible = 5;
  const shouldTruncate = breadcrumbHistory.length > maxVisible;
  let displayBreadcrumbs: (BreadcrumbItem | { type: 'ellipsis' })[] = breadcrumbHistory;

  if (shouldTruncate) {
    const first = breadcrumbHistory[0];
    const lastTwo = breadcrumbHistory.slice(-2);
    displayBreadcrumbs = [first, { type: 'ellipsis' as const }, ...lastTwo];
  }

  return (
    <div className="flex items-center gap-1 text-xs text-df-text-secondary">
      <button
        onClick={() => clearBreadcrumbs(scope)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-df-control-bg transition-colors"
        title="Clear navigation history"
      >
        <Home size={14} />
      </button>
      {displayBreadcrumbs.map((item, idx) => {
        if ('type' in item && item.type === 'ellipsis') {
          return (
            <React.Fragment key={`ellipsis-${idx}`}>
              <ChevronRight size={14} className="text-df-text-tertiary" />
              <span className="px-1 text-df-text-tertiary">...</span>
            </React.Fragment>
          );
        }

        const breadcrumb = item as BreadcrumbItem;
        const isLast = idx === displayBreadcrumbs.length - 1;
        const actualIndex = shouldTruncate
          ? idx === 0
            ? 0
            : breadcrumbHistory.length - (displayBreadcrumbs.length - idx)
          : idx;

        return (
          <React.Fragment key={`${breadcrumb.graphId}-${breadcrumb.scope}-${idx}`}>
            <ChevronRight size={14} className="text-df-text-tertiary" />
            <button
              onClick={() => navigateToBreadcrumb(scope, actualIndex)}
              className={`px-2 py-1 rounded transition-colors ${
                isLast
                  ? 'text-df-text-primary font-semibold'
                  : 'text-df-text-secondary hover:text-df-text-primary hover:bg-df-control-bg'
              }`}
              title={`Navigate to ${breadcrumb.title}`}
            >
              <span className="capitalize">{breadcrumb.scope}:</span> {breadcrumb.title}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
