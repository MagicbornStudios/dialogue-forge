import * as React from 'react';
import type { ReactNode } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';

interface WriterTreeRowProps {
  node: NodeRendererProps<any>['node'];
  style: React.CSSProperties;
  dragHandle?: NodeRendererProps<any>['dragHandle'];
  icon?: ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
  onAddChild?: () => void;
  canAddChild?: boolean;
  contextMenu?: ReactNode;
}

export function WriterTreeRow({
  node,
  style,
  dragHandle,
  icon,
  isSelected = false,
  onSelect,
  onAddChild,
  canAddChild = false,
  contextMenu,
}: WriterTreeRowProps) {
  const rowContent = (
    <div
      ref={dragHandle}
      style={style}
      className="group flex items-center gap-1 px-2"
    >
      {/* Expand/Collapse button */}
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary hover:text-df-text-primary transition-colors"
        onClick={() => node.toggle()}
        aria-label={node.isOpen ? 'Collapse' : 'Expand'}
        style={{ visibility: node.isLeaf ? 'hidden' : 'visible' }}
      >
        {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Label */}
      <button
        type="button"
        className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${
          isSelected
            ? 'bg-df-control-active/40 text-df-text-primary font-medium'
            : 'text-df-text-secondary hover:bg-df-control-bg hover:text-df-text-primary'
        }`}
        onClick={onSelect}
      >
        {icon ? <span className="text-df-text-tertiary flex-shrink-0">{icon}</span> : null}
        <span className="truncate">{node.data.name}</span>
      </button>

      {/* Inline add button - shows on hover */}
      {canAddChild && onAddChild && (
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-df-control-bg hover:text-df-text-primary transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild();
          }}
          title={`Add child`}
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );

  if (contextMenu) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {rowContent}
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-[160px]">
          {contextMenu}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return rowContent;
}
