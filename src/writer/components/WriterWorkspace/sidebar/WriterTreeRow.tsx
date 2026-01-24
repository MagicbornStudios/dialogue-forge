import * as React from 'react';
import type { ReactNode } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import { Plus, Circle, Flag } from 'lucide-react';

interface WriterTreeRowProps {
  node: {
    id: string;
    data: any;
    isOpen?: boolean;
    isLeaf?: boolean;
    level?: number;
    toggle?: () => void;
  };
  style?: React.CSSProperties;
  dragHandle?: ((el: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement>;
  icon?: ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
  onAddChild?: () => void;
  canAddChild?: boolean;
  hasDetour?: boolean;
  isEndNode?: boolean;
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
  hasDetour = false,
  isEndNode = false,
}: WriterTreeRowProps) {
  const rowContent = (
    <div
      ref={dragHandle}
      style={style}
      className="group flex items-center gap-1 px-2"
    >
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
        <span className="truncate flex-1">{node.data?.name || ''}</span>
        {/* Detour indicator - orange/brown bullet */}
        {hasDetour && (
          <Circle 
            size={8} 
            fill="currentColor" 
            className="text-orange-600 dark:text-orange-500 flex-shrink-0" 
            title="Has detour connection"
          />
        )}
        {/* End node label */}
        {isEndNode && (
          <span className="text-[10px] text-df-text-tertiary flex items-center gap-1 flex-shrink-0" title="End node">
            <Flag size={10} />
            <span>End</span>
          </span>
        )}
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

  return rowContent;
}
