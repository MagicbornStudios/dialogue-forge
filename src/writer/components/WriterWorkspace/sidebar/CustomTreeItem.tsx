import * as React from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Plus, Circle, Flag } from 'lucide-react';

interface CustomTreeItemProps {
  node: {
    id: string;
    name: string;
    page: any;
    children?: CustomTreeItemProps['node'][];
    hasDetour?: boolean;
    isEndNode?: boolean;
  };
  level?: number;
  icon?: ReactNode;
  isSelected?: boolean;
  isExpanded?: boolean;
  expandedSet?: Set<string>;
  onSelect?: (pageId: number) => void;
  onToggle?: (nodeId: string) => void;
  onAddChild?: (page?: any) => void;
  canAddChild?: boolean;
  renderPlaceholder?: (isEmpty: boolean, page: any, level: number) => ReactNode;
  getIconForPageType?: (pageType: string) => ReactNode;
  activePageId?: number | null;
}

export function CustomTreeItem({
  node,
  level = 0,
  icon,
  isSelected = false,
  isExpanded = false,
  expandedSet,
  onToggle,
  onSelect,
  onAddChild,
  canAddChild = false,
  renderPlaceholder,
  getIconForPageType,
  activePageId,
}: CustomTreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isEmpty = !hasChildren && node.page?.pageType !== 'PAGE';
  const indent = level * 24;
  const isExpandedState = expandedSet ? expandedSet.has(node.id) : isExpanded;

  const rowContent = (
    <div
      className="group flex items-center gap-1 px-2"
      style={{ paddingLeft: `${indent}px` }}
    >
      {/* Expand/Collapse button */}
      {hasChildren ? (
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary hover:text-df-text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(node.id);
          }}
          aria-label={isExpandedState ? 'Collapse' : 'Expand'}
        >
          {isExpandedState ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      ) : (
        <div className="w-6" /> // Spacer for alignment
      )}

      {/* Label */}
      <button
        type="button"
        className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${
          isSelected
            ? 'bg-df-control-active/40 text-df-text-primary font-medium'
            : 'text-df-text-secondary hover:bg-df-control-bg hover:text-df-text-primary'
        }`}
        onClick={() => onSelect?.(node.page.id)}
      >
        {icon ? <span className="text-df-text-tertiary flex-shrink-0">{icon}</span> : null}
        <span className="truncate flex-1">{node.name}</span>
        {/* Detour indicator */}
        {node.hasDetour && (
          <Circle 
            size={8} 
            fill="currentColor" 
            className="text-orange-600 dark:text-orange-500 flex-shrink-0" 
            title="Has detour connection"
          />
        )}
        {/* End node label */}
        {node.isEndNode && (
          <span className="text-[10px] text-df-text-tertiary flex items-center gap-1 flex-shrink-0" title="End node">
            <Flag size={10} />
            <span>End</span>
          </span>
        )}
      </button>

      {/* Inline add button */}
      {canAddChild && onAddChild && (
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-df-control-bg hover:text-df-text-primary transition-all"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddChild) {
              onAddChild(node.page);
            }
          }}
          title="Add child"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );

  return (
    <div key={node.id} className="tree-item">
      {rowContent}
      {hasChildren && isExpandedState && (
        <div className="tree-children">
          {node.children?.map((child) => {
            const childIcon = getIconForPageType ? getIconForPageType(child.page?.pageType) : icon;
            const childIsSelected = activePageId ? child.page?.id === activePageId : false;
            const childCanAddChild = child.page?.pageType !== 'PAGE';
            
            return (
              <CustomTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                icon={childIcon}
                isSelected={childIsSelected}
                isExpanded={false}
                expandedSet={expandedSet}
                onSelect={() => onSelect?.(child.page.id)}
                onToggle={onToggle}
                onAddChild={onAddChild ? (page) => onAddChild(page) : undefined}
                canAddChild={childCanAddChild}
                renderPlaceholder={renderPlaceholder}
                getIconForPageType={getIconForPageType}
                activePageId={activePageId}
              />
            );
          })}
        </div>
      )}
      {/* Placeholder for empty sections */}
      {isEmpty && isExpandedState && renderPlaceholder && renderPlaceholder(true, node.page, level)}
    </div>
  );
}
