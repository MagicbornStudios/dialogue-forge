import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, ExternalLink, Edit, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@magicborn/shared/ui/context-menu';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useForgeWorkspaceActions } from '@magicborn/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { FORGE_GRAPH_KIND } from '@magicborn/forge/types/forge-graph';
import { createEmptyForgeGraphDoc } from '@magicborn/forge/lib/utils/forge-flow-helpers';
import { InlineRenameInput } from './InlineRenameInput';
import { useHotkeys } from 'react-hotkeys-hook';
import { Kbd } from '@magicborn/shared/ui/kbd';
import { SectionHeader, type SectionToolbarAction } from './SectionHeader';

interface ForgeNarrativeListProps {
  className?: string;
}

export function ForgeNarrativeList({ className }: ForgeNarrativeListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingGraphId, setRenamingGraphId] = useState<string | null>(null)
  
  // Read from store - memoize the selector result to prevent re-renders
  // Filter out graphs with id === 0 (unsaved graphs) from sidebar display
  const allGraphs = useForgeWorkspaceStore(s => s.graphs.byId)
  const narrativeGraphs = useMemo(() => 
    Object.values(allGraphs).filter(g => 
      g.kind === FORGE_GRAPH_KIND.NARRATIVE && g.id !== 0
    ),
    [allGraphs]
  )
  const activeNarrativeGraphId = useForgeWorkspaceStore(s => s.activeNarrativeGraphId)
  const selectedProjectId = useForgeWorkspaceStore(s => s.selectedProjectId)
  const dataAdapter = useForgeWorkspaceStore(s => s.dataAdapter)
  const setGraph = useForgeWorkspaceStore(s => s.actions.setGraph)
  const removeGraph = useForgeWorkspaceStore(s => s.actions.removeGraph)
  const openGraphInScope = useForgeWorkspaceStore(s => s.actions.openGraphInScope)
  const workspaceActions = useForgeWorkspaceActions()
  
  // F2 hotkey for rename (only when a narrative is selected)
  useHotkeys(
    'f2',
    (e) => {
      if (activeNarrativeGraphId && !renamingGraphId) {
        e.preventDefault();
        setRenamingGraphId(activeNarrativeGraphId);
      }
    },
    { enableOnFormTags: false, enabled: !!activeNarrativeGraphId && !renamingGraphId }
  )
  
  const handleRename = async (graphId: string, newTitle: string) => {
    if (!dataAdapter) {
      console.warn('Cannot rename: dataAdapter unavailable');
      setRenamingGraphId(null);
      return;
    }
    
    try {
      const updatedGraph = await dataAdapter.updateGraph(Number(graphId), { title: newTitle });
      setGraph(graphId, updatedGraph);
      setRenamingGraphId(null);
    } catch (error) {
      console.error('Failed to rename graph:', error);
      setRenamingGraphId(null);
    }
  };

  const handleDeleteGraph = async (graphId: string, title: string) => {
    if (!dataAdapter) {
      console.warn('Cannot delete graph: dataAdapter unavailable');
      return;
    }

    const confirmed = confirm(`Delete narrative "${title}"?`);
    if (!confirmed) return;

    const remainingGraphs = narrativeGraphs.filter((g) => String(g.id) !== graphId);
    const nextGraphId = remainingGraphs[0]?.id ? String(remainingGraphs[0].id) : null;
    const wasActive = activeNarrativeGraphId === graphId;

    try {
      await dataAdapter.deleteGraph(Number(graphId));
      removeGraph(graphId);

      if (wasActive && nextGraphId) {
        await openGraphInScope('narrative', nextGraphId, { pushBreadcrumb: false });
      }
    } catch (error) {
      console.error('Failed to delete graph:', error);
    }
  };
  
  // Filter locally
  const filteredGraphs = useMemo(() => {
    return narrativeGraphs.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [narrativeGraphs, searchQuery])
  
  // Handle narrative creation
  const handleCreateNarrative = async () => {
    if (!selectedProjectId || !dataAdapter) {
      console.warn('Cannot create narrative: no project selected or dataAdapter unavailable')
      return
    }
    
    try {
      const emptyGraph = createEmptyForgeGraphDoc({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.NARRATIVE,
        title: 'New Narrative'
      })
      
      const createdGraph = await dataAdapter.createGraph({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.NARRATIVE,
        title: 'New Narrative',
        flow: emptyGraph.flow,
        startNodeId: emptyGraph.startNodeId,
        endNodeIds: emptyGraph.endNodeIds,
      })
      
      // Add to cache
      setGraph(String(createdGraph.id), createdGraph)
      
      // Open the new graph
      workspaceActions.openNarrativeGraph(String(createdGraph.id))
    } catch (error) {
      console.error('Failed to create narrative:', error)
    }
  }
  
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
  
  const toolbarActions: SectionToolbarAction[] = [
    {
      id: 'create-narrative',
      label: 'Create Narrative',
      icon: <Plus size={12} />,
      onClick: handleCreateNarrative,
      tooltip: 'Create narrative',
    },
  ];

  return (
    <div className={`flex h-full w-full flex-col ${className ?? ''}`}>
      <SectionHeader
        title="Narratives"
        icon={<BookOpen size={14} />}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search narratives..."
        badge={filteredGraphs.length > 0 ? { label: String(filteredGraphs.length) } : undefined}
        focusedEditor={focusedEditor}
        toolbarActions={toolbarActions}
      />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredGraphs.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No narratives found' : 'No narratives'}
          </div>
        ) : (
          <div className="py-1">
            {filteredGraphs.map(graph => {
              const isSelected = activeNarrativeGraphId === String(graph.id);
              const isRenaming = renamingGraphId === String(graph.id);
              
              return (
                <ContextMenu key={graph.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={`w-full px-2 py-1.5 text-left text-xs transition-colors duration-200 ${
                        isSelected && !isRenaming
                          ? 'bg-muted text-foreground border-l-2 border-[var(--editor-border-active)]'
                          : !isRenaming
                          ? 'text-muted-foreground hover:bg-muted hover:text-foreground hover:border-l-2 hover:border-[var(--editor-border-hover)]'
                          : ''
                      }`}
                    >
                      {isRenaming ? (
                        <InlineRenameInput
                          value={graph.title || ''}
                          onSave={(newTitle) => handleRename(String(graph.id), newTitle)}
                          onCancel={() => setRenamingGraphId(null)}
                          className="w-full"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => workspaceActions.openNarrativeGraph(String(graph.id))}
                          className="w-full flex items-center gap-1.5 truncate"
                        >
                          <BookOpen size={12} className="shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">{graph.title ?? String(graph.id)}</span>
                        </button>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem onSelect={() => workspaceActions.openNarrativeGraph(String(graph.id))}>
                      <ExternalLink size={14} className="mr-2" />
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => setRenamingGraphId(String(graph.id))}>
                      <Edit size={14} className="mr-2" />
                      <span>Rename</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        <Kbd variant="outline">F2</Kbd>
                      </span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onSelect={() => handleDeleteGraph(String(graph.id), graph.title ?? String(graph.id))}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
