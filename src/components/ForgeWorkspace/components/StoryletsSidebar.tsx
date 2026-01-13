import React, { useState, useMemo } from 'react';
import { BookOpen, Info, Search, Plus, ExternalLink, Edit, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/src/components/ui/context-menu';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';
import { useForgeWorkspaceActions } from '../hooks/useForgeWorkspaceActions';
import { FORGE_GRAPH_KIND, FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';
import { createEmptyForgeGraphDoc } from '@/src/utils/forge-flow-helpers';

interface StoryletsSidebarProps {
  className?: string;
}

export function StoryletsSidebar({ className }: StoryletsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Read from store
  const storyletGraphs = useForgeWorkspaceStore(s => 
    Object.values(s.graphs.byId).filter(g => g.kind === FORGE_GRAPH_KIND.STORYLET)
  )
  const activeStoryletGraphId = useForgeWorkspaceStore(s => s.activeStoryletGraphId)
  const selectedProjectId = useForgeWorkspaceStore(s => s.selectedProjectId)
  const dataAdapter = useForgeWorkspaceStore(s => s.dataAdapter)
  const setGraph = useForgeWorkspaceStore(s => s.actions.setGraph)
  const workspaceActions = useForgeWorkspaceActions()
  
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
      
      // Create a minimal start node for the new graph
      const startNodeId = `start_${Date.now()}`
      const startNode = {
        id: startNodeId,
        type: FORGE_NODE_TYPE.CHARACTER,
        position: { x: 0, y: 0 },
        data: {
          id: startNodeId,
          type: FORGE_NODE_TYPE.CHARACTER,
          label: 'Start',
          content: 'This is the starting point.',
        },
      }
      
      const flow = {
        nodes: [startNode],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }
      
      const createdGraph = await dataAdapter.createGraph({
        projectId: selectedProjectId,
        kind: FORGE_GRAPH_KIND.STORYLET,
        title: emptyGraph.title,
        flow,
        startNodeId,
        endNodeIds: [],
      })
      
      // Add to cache
      setGraph(String(createdGraph.id), createdGraph)
      
      // Open the new graph
      workspaceActions.openStoryletGraph(String(createdGraph.id))
    } catch (error) {
      console.error('Failed to create storylet:', error)
    }
  }
  return (
    <div className={`flex w-[320px] min-w-[280px] flex-col gap-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
          <BookOpen size={12} />
          Storylets
          <span title="Manage storylets for the selected project.">
            <Info size={12} />
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className="rounded-md px-2 py-1 text-df-text-secondary hover:text-df-text-primary"
            onClick={handleCreateStorylet}
            title="Add storylet"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-2">
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-2.5 text-df-text-tertiary" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search storylets..."
                className="w-full rounded-md border border-df-control-border bg-df-control-bg py-2 pl-7 pr-2 text-xs text-df-text-primary"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
              onClick={handleCreateStorylet}
              title="Add storylet"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredGraphs.map(graph => {
              const isSelected = activeStoryletGraphId === String(graph.id);
              return (
                <ContextMenu key={graph.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={() => workspaceActions.openStoryletGraph(String(graph.id))}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                        isSelected ? 'border-df-node-selected bg-df-control-active/30 text-df-text-primary' : 'border-df-node-border text-df-text-secondary hover:border-df-node-selected'
                      }`}
                      title="Select storylet"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold">{graph.title ?? String(graph.id)}</div>
                        <div className="flex items-center gap-1">
                          <ExternalLink size={14} className="text-df-text-tertiary" />
                        </div>
                      </div>
                      <div className="text-[10px] text-df-text-tertiary">ID: {graph.id}</div>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-56">
                    <ContextMenuItem onSelect={() => workspaceActions.openStoryletGraph(String(graph.id))}>
                      <ExternalLink size={14} className="mr-2" /> Open Graph
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => {
                      // TODO: Open metadata edit modal
                      console.log('Edit metadata for graph:', graph.id)
                    }}>
                      <Edit size={14} className="mr-2" /> Edit Metadata
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onSelect={async () => {
                        // TODO: Implement delete with confirmation
                        if (confirm(`Delete storylet "${graph.title}"?`)) {
                          console.log('Delete graph:', graph.id)
                          // await dataAdapter?.deleteGraph?.(graph.id)
                          // Remove from cache
                          // setGraph(String(graph.id), ...) // or remove action
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            {filteredGraphs.length === 0 && (
              <div className="rounded-lg border border-df-node-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
                {searchQuery ? 'No storylets found.' : 'No storylets. Click + to create one.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
