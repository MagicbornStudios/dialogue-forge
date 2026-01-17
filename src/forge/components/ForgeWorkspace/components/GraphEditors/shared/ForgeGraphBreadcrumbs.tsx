import React, { useState, useMemo } from 'react';
import { ChevronRight, Home, Edit } from 'lucide-react';
import { useForgeWorkspaceStoreInstance } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type { BreadcrumbItem } from '@/forge/components/ForgeWorkspace/store/slices/graph.slice';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { Kbd } from '@/shared/ui/kbd';
import { InlineRenameInput } from '@/forge/components/ForgeWorkspace/components/ForgeSideBar/InlineRenameInput';
import { cn } from '@/shared/lib/utils';

interface ForgeGraphBreadcrumbsProps {
  scope: "narrative" | "storylet";
}

export function ForgeGraphBreadcrumbs({ scope }: ForgeGraphBreadcrumbsProps) {
  const [renamingGraphId, setRenamingGraphId] = useState<string | null>(null);
  
  // Get store instance once - reduces hook calls
  const store = useForgeWorkspaceStoreInstance();
  
  // Use useShallow to prevent infinite re-renders from object recreation
  // useShallow does shallow comparison of the returned object
  const storeState = useStore(
    store,
    useShallow((state) => ({
      breadcrumbHistory: state.breadcrumbHistoryByScope[scope],
      activeGraphId: scope === 'narrative' ? state.activeNarrativeGraphId : state.activeStoryletGraphId,
      graphs: state.graphs.byId,
      dataAdapter: state.dataAdapter,
      selectedProjectId: state.selectedProjectId,
      navigateToBreadcrumb: state.actions.navigateToBreadcrumb,
      clearBreadcrumbs: state.actions.clearBreadcrumbs,
      setGraph: state.actions.setGraph,
    }))
  );
  
  // Derive current graph from state (no hook)
  const currentGraph = useMemo(() => {
    return storeState.activeGraphId ? storeState.graphs[storeState.activeGraphId] ?? null : null;
  }, [storeState.activeGraphId, storeState.graphs]);
  
  const currentGraphTitle = currentGraph?.title || 'Untitled Graph';
  
  // F2 hotkey for renaming
  useHotkeys('f2', () => {
    if (storeState.activeGraphId && !renamingGraphId) {
      setRenamingGraphId(storeState.activeGraphId);
    }
  }, { enableOnFormTags: true, enabled: !!storeState.activeGraphId && !renamingGraphId });
  
  // Handle rename
  const handleRenameGraph = async (graphId: string, newTitle: string) => {
    if (!storeState.dataAdapter || !storeState.selectedProjectId) return;
    try {
      await storeState.dataAdapter.updateGraph(Number(graphId), { title: newTitle });
      // Update local store
      if (currentGraph) {
        storeState.setGraph(graphId, { ...currentGraph, title: newTitle });
      }
      setRenamingGraphId(null);
    } catch (error) {
      console.error('Failed to rename graph:', error);
      setRenamingGraphId(null);
    }
  };

  // Always show home icon and current graph name, even when no breadcrumbs exist
  if (storeState.breadcrumbHistory.length === 0) {
    const isRenaming = renamingGraphId === storeState.activeGraphId;
    
    return (
      <div className="flex items-center gap-1 text-xs text-df-text-secondary">
        <button
          onClick={() => storeState.clearBreadcrumbs(scope)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-df-control-bg transition-colors"
          title="Clear navigation history"
        >
          <Home size={14} />
        </button>
        <ChevronRight size={14} className="text-df-text-tertiary" />
        {isRenaming && storeState.activeGraphId ? (
          <InlineRenameInput
            value={currentGraphTitle}
            onSave={(newTitle) => handleRenameGraph(storeState.activeGraphId!, newTitle)}
            onCancel={() => setRenamingGraphId(null)}
            className="px-2 py-1 text-xs font-medium"
          />
        ) : (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <span 
                className="px-2 py-1 text-df-text-primary font-medium cursor-pointer hover:bg-df-control-bg rounded transition-colors"
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (storeState.activeGraphId) {
                    setRenamingGraphId(storeState.activeGraphId);
                  }
                }}
                title="Double-click to rename"
              >
                {currentGraphTitle}
              </span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => storeState.activeGraphId && setRenamingGraphId(storeState.activeGraphId)}>
                <Edit size={14} className="mr-2" />
                Rename <Kbd className="ml-auto">F2</Kbd>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </div>
    );
  }

  // Truncate if too long (show first, last 2, and "...")
  const maxVisible = 5;
  const shouldTruncate = storeState.breadcrumbHistory.length > maxVisible;
  let displayBreadcrumbs: (BreadcrumbItem | { type: 'ellipsis' })[] = storeState.breadcrumbHistory;

  if (shouldTruncate) {
    const first = storeState.breadcrumbHistory[0];
    const lastTwo = storeState.breadcrumbHistory.slice(-2);
    displayBreadcrumbs = [first, { type: 'ellipsis' as const }, ...lastTwo];
  }

  return (
    <div className="flex items-center gap-1 text-xs text-df-text-secondary">
      <button
        onClick={() => storeState.clearBreadcrumbs(scope)}
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
            : storeState.breadcrumbHistory.length - (displayBreadcrumbs.length - idx)
          : idx;

        const isRenamingThis = isLast && renamingGraphId === breadcrumb.graphId;
        
        return (
          <React.Fragment key={`${breadcrumb.graphId}-${breadcrumb.scope}-${idx}`}>
            <ChevronRight size={14} className="text-df-text-tertiary" />
            {isRenamingThis ? (
              <InlineRenameInput
                value={breadcrumb.title}
                onSave={(newTitle) => handleRenameGraph(breadcrumb.graphId, newTitle)}
                onCancel={() => setRenamingGraphId(null)}
                className={cn(
                  "px-2 py-1 text-xs font-medium",
                  isLast && "font-semibold"
                )}
              />
            ) : (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={() => storeState.navigateToBreadcrumb(scope, actualIndex)}
                    onDoubleClick={(e) => {
                      if (isLast) {
                        e.preventDefault();
                        e.stopPropagation();
                        setRenamingGraphId(breadcrumb.graphId);
                      }
                    }}
                    className={cn(
                      "px-2 py-1 rounded transition-colors text-left",
                      isLast
                        ? 'text-df-text-primary font-semibold'
                        : 'text-df-text-secondary hover:text-df-text-primary hover:bg-df-control-bg'
                    )}
                    title={isLast ? `Double-click to rename ${breadcrumb.title}` : `Navigate to ${breadcrumb.title}`}
                  >
                    {breadcrumb.title}
                  </button>
                </ContextMenuTrigger>
                {isLast && (
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={() => setRenamingGraphId(breadcrumb.graphId)}>
                      <Edit size={14} className="mr-2" />
                      Rename <Kbd className="ml-auto">F2</Kbd>
                    </ContextMenuItem>
                  </ContextMenuContent>
                )}
              </ContextMenu>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
