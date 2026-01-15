import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, ExternalLink, Edit, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { FORGE_GRAPH_KIND } from '@/forge/types/forge-graph';
import { createGraphWithStartEnd } from '@/forge/lib/utils/forge-flow-helpers';
import { SearchInput } from '@/shared/ui/SearchInput';

interface ForgeNarrativeListProps {
  className?: string;
}

export function ForgeNarrativeList({ className }: ForgeNarrativeListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Read from store - memoize the selector result to prevent re-renders
  const allGraphs = useForgeWorkspaceStore(s => s.graphs.byId)
  const narrativeGraphs = useMemo(() => 
    Object.values(allGraphs).filter(g => g.kind === FORGE_GRAPH_KIND.NARRATIVE),
    [allGraphs]
  )
  const activeNarrativeGraphId = useForgeWorkspaceStore(s => s.activeNarrativeGraphId)
  const selectedProjectId = useForgeWorkspaceStore(s => s.selectedProjectId)
  const dataAdapter = useForgeWorkspaceStore(s => s.dataAdapter)
  const setGraph = useForgeWorkspaceStore(s => s.actions.setGraph)
  const workspaceActions = useForgeWorkspaceActions()
  
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
      const { flow, startNodeId, endNodeIds } = createGraphWithStartEnd({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.NARRATIVE,
        title: 'New Narrative'
      })
      
      const createdGraph = await dataAdapter.createGraph({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.NARRATIVE,
        title: 'New Narrative',
        flow,
        startNodeId,
        endNodeIds,
      })
      
      // Add to cache
      setGraph(String(createdGraph.id), createdGraph)
      
      // Open the new graph
      workspaceActions.openNarrativeGraph(String(createdGraph.id))
    } catch (error) {
      console.error('Failed to create narrative:', error)
    }
  }
  
  return (
    <div className={`flex h-full w-full flex-col ${className ?? ''}`}>
      {/* Compact header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-df-sidebar-border">
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} className="text-df-text-tertiary" />
          <span className="text-xs font-medium text-df-text-secondary">Narratives</span>
          {filteredGraphs.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {filteredGraphs.length}
            </Badge>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCreateNarrative}
              >
                <Plus size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create narrative</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-df-sidebar-border">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search..."
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredGraphs.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-df-text-tertiary">
            {searchQuery ? 'No narratives found' : 'No narratives'}
          </div>
        ) : (
          <div className="py-1">
            {filteredGraphs.map(graph => {
              const isSelected = activeNarrativeGraphId === String(graph.id);
              return (
                <ContextMenu key={graph.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={() => workspaceActions.openNarrativeGraph(String(graph.id))}
                      className={`w-full px-2 py-1.5 text-left text-xs transition-colors duration-200 ${
                        isSelected
                          ? 'bg-df-control-hover text-df-text-primary border-l-2 border-[var(--color-df-border-active)]'
                          : 'text-df-text-secondary hover:bg-df-control-hover hover:text-df-text-primary hover:border-l-2 hover:border-[var(--color-df-border-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <BookOpen size={12} className="shrink-0 text-df-text-tertiary" />
                        <span className="truncate font-medium">{graph.title ?? String(graph.id)}</span>
                      </div>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem onSelect={() => workspaceActions.openNarrativeGraph(String(graph.id))}>
                      <ExternalLink size={14} className="mr-2" />
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => {
                      console.log('Edit metadata for graph:', graph.id)
                    }}>
                      <Edit size={14} className="mr-2" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onSelect={async () => {
                        if (confirm(`Delete narrative "${graph.title}"?`)) {
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
