import * as React from 'react';
import type { ReactNode } from 'react';
import type { NodeRendererProps } from 'react-arborist';
import { Plus, Circle, Flag, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';

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
  onDelete?: () => void;
  canAddChild?: boolean;
  hasDetour?: boolean;
  hasConditional?: boolean;
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
  onDelete,
  canAddChild = false,
  hasDetour = false,
  hasConditional = false,
  isEndNode = false,
}: WriterTreeRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
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
              <span title="Has detour connection">
                <Circle 
                  size={8} 
                  fill="currentColor" 
                  className="text-orange-600 dark:text-orange-500 flex-shrink-0" 
                />
              </span>
            )}
            {/* Conditional indicator - blue/purple bullet */}
            {hasConditional && (
              <span title="Has conditional connection">
                <Circle 
                  size={8} 
                  fill="currentColor" 
                  className="text-blue-600 dark:text-blue-500 flex-shrink-0" 
                />
              </span>
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
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onDelete && (
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
