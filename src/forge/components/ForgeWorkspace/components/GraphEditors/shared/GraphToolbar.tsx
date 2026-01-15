import React from 'react';
import { Info, Download } from 'lucide-react';
import { GraphViewModeTabs } from './GraphViewModeTabs';
import { Button } from '../../ui/button';
import type { ViewMode } from '../../../../../types/constants';

interface GraphToolbarProps {
  title: string;
  titleIcon?: React.ReactNode;
  titleTooltip?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExport?: () => void;
  exportLabel?: string;
  className?: string;
}

export function GraphToolbar({
  title,
  titleIcon,
  titleTooltip,
  viewMode,
  onViewModeChange,
  onExport,
  exportLabel = 'Export',
  className = '',
}: GraphToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5 ${className}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
        {titleIcon}
        {title}
        {titleTooltip && (
          <span title={titleTooltip}>
            <Info size={12} />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <GraphViewModeTabs value={viewMode} onChange={onViewModeChange} />
        {onExport && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            title="Export yarn"
            className="h-10"
          >
            <Download size={12} />
            {exportLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
