import React, { useState, useMemo } from 'react';
import { Layers, Plus, ExternalLink, Edit, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { FORGE_GRAPH_KIND } from '@/forge/types/forge-graph';
import { createEmptyForgeGraphDoc } from '@/forge/lib/utils/forge-flow-helpers';
import { InlineRenameInput } from './InlineRenameInput';
import { useHotkeys } from 'react-hotkeys-hook';
import { Kbd } from '@/shared/ui/kbd';
import { SectionHeader, type SectionToolbarAction } from './SectionHeader';

interface StoryletsListProps {
  className?: string;
}

export function StoryletList({ className }: StoryletsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingGraphId, setRenamingGraphId] = useState<string | null>(null)
  
  // Read from store - memoize the selector result to prevent re-renders
  // Filter out graphs with id === 0 (unsaved graphs) from sidebar display
  const allGraphs = useForgeWorkspaceStore(s => s.graphs.byId)
  const storyletGraphs = useMemo(() => 
    Object.values(allGraphs).filter(g => 
      g.kind === FORGE_GRAPH_KIND.STORYLET && g.id !== 0
    ),
    [allGraphs]
  )
  const activeStoryletGraphId = useForgeWorkspaceStore(s => s.activeStoryletGraphId)
  const selectedProjectId = useForgeWorkspaceStore(s => s.selectedProjectId)
  const dataAdapter = useForgeWorkspaceStore(s => s.dataAdapter)
  const setGraph = useForgeWorkspaceStore(s => s.actions.setGraph)
  const workspaceActions = useForgeWorkspaceActions()
  
  // F2 hotkey for rename (only when a storylet is selected)
  useHotkeys(
    'f2',
    (e) => {
      if (activeStoryletGraphId && !renamingGraphId) {
        e.preventDefault();
        setRenamingGraphId(activeStoryletGraphId);
      }
    },
    { enableOnFormTags: false, enabled: !!activeStoryletGraphId && !renamingGraphId }
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
  
  // Filter locally
  const filteredGraphs = useMemo(() => {
    return storyletGraphs.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [storyletGraphs, searchQuery])
  
  // Handle storylet creation
  const handleCreateStorylet = async () => {
    if (!selectedProjectId || !dataAdapter) {
      console.warn('Cannot create storylet: no project selected or dataAdapter unavailable')
      return
    }
    
    try {
      const emptyGraph = createEmptyForgeGraphDoc({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.STORYLET,
        title: 'New Storylet'
      })
      
      const createdGraph = await dataAdapter.createGraph({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.STORYLET,
        title: 'New Storylet',
        flow: emptyGraph.flow,
        startNodeId: emptyGraph.startNodeId,
        endNodeIds: emptyGraph.endNodeIds,
      })
      
      // Add to cache
      setGraph(String(createdGraph.id), createdGraph)
      
      // Open the new graph
      workspaceActions.openStoryletGraph(String(createdGraph.id))
    } catch (error) {
      console.error('Failed to create storylet:', error)
    }
  }
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
  
  const toolbarActions: SectionToolbarAction[] = [
    {
      id: 'create-storylet',
      label: 'Create Storylet',
      icon: <Plus size={12} />,
      onClick: handleCreateStorylet,
      tooltip: 'Create storylet',
    },
  ];

  return (
    <div className={`flex h-full w-full flex-col ${className ?? ''}`}>
      <SectionHeader
        title="Storylets"
        icon={<Layers size={14} />}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search storylets..."
        badge={filteredGraphs.length > 0 ? { label: String(filteredGraphs.length) } : undefined}
        focusedEditor={focusedEditor}
        toolbarActions={toolbarActions}
      />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredGraphs.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No storylets found' : 'No storylets'}
          </div>
        ) : (
          <div className="py-1">
            {filteredGraphs.map(graph => {
              const isSelected = activeStoryletGraphId === String(graph.id);
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
                          onClick={() => workspaceActions.openStoryletGraph(String(graph.id))}
                          className="w-full flex items-center gap-1.5 truncate"
                        >
                          <Layers size={12} className="shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">{graph.title ?? String(graph.id)}</span>
                        </button>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem onSelect={() => workspaceActions.openStoryletGraph(String(graph.id))}>
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
                      onSelect={async () => {
                        if (confirm(`Delete storylet "${graph.title}"?`)) {
                          console.log('Delete graph:', graph.id)
                        }
                      }}
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
