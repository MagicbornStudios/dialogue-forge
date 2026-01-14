import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface WriterTreeRowProps {
  label: string;
  depth: number;
  icon?: ReactNode;
  isSelected?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
}

export function WriterTreeRow({
  label,
  depth,
  icon,
  isSelected = false,
  isExpanded = false,
  hasChildren = false,
  onToggle,
  onSelect,
}: WriterTreeRowProps) {
  return (
    <div
      className="flex items-center gap-1"
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary hover:text-df-text-primary"
        onClick={onToggle}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        aria-hidden={!hasChildren}
        disabled={!hasChildren}
      >
        {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
      </button>
      <button
        type="button"
        className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${
          isSelected
            ? 'bg-df-control-active/40 text-df-text-primary'
            : 'text-df-text-secondary hover:bg-df-control-bg hover:text-df-text-primary'
        }`}
        onClick={onSelect}
      >
        {icon ? <span className="text-df-text-tertiary">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
