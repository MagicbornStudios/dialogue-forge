import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { ForgeGraphDoc } from '@/forge/types/forge-graph';
import { NextNodeSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/NodeEditor/NextNodeSelector';
import { ForgeNode, FORGE_GRAPH_KIND, FORGE_STORYLET_CALL_MODE } from '@/forge/types/forge-graph';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { Button } from '@/shared/ui/button';

interface DetourNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
}

export function DetourNodeFields({
  node,
  graph,
  onUpdate,
  onFocusNode,
}: DetourNodeFieldsProps) {
  const workspaceActions = useForgeWorkspaceActions();
  const pushBreadcrumb = useForgeWorkspaceStore((s) => s.actions.pushBreadcrumb);
  const storyletId = node.storyletCall?.targetGraphId;
  
  // Get available storylet graphs from workspace store
  const allGraphs = useForgeWorkspaceStore(s => s.graphs.byId);
  const storyletGraphs = useMemo(() => 
    Object.values(allGraphs).filter(g => g.kind === FORGE_GRAPH_KIND.STORYLET),
    [allGraphs]
  );
  
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Title</label>
        <input
          type="text"
          value={node.label || ''}
          onChange={(event) => onUpdate({ label: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-detour-accent)] outline-none"
          placeholder="Detour title"
        />
      </div>
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={node.content || ''}
          onChange={(event) => onUpdate({ content: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-detour-accent)] outline-none min-h-[60px] resize-y"
          placeholder="Detour summary/description"
        />
      </div>
      
      {storyletId && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Push current graph to breadcrumb before opening new one
              const currentGraphId = graph?.id ? String(graph.id) : null;
              if (currentGraphId && graph) {
                pushBreadcrumb({
                  graphId: currentGraphId,
                  title: graph.title || `Graph ${currentGraphId}`,
                  scope: 'storylet',
                });
              }
              workspaceActions.openStoryletGraph(String(storyletId));
            }}
            className="w-full"
          >
            <ExternalLink size={14} className="mr-2" />
            Open Storylet Graph
          </Button>
        </div>
      )}
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Storylet Graph</label>
        <select
          value={storyletId || ''}
          onChange={(event) => {
            const newGraphId = event.target.value ? parseInt(event.target.value) : undefined;
            onUpdate({
              storyletCall: newGraphId && node.storyletCall?.mode ? {
                targetGraphId: newGraphId,
                mode: node.storyletCall.mode,
                targetStartNodeId: node.storyletCall?.targetStartNodeId,
                returnNodeId: node.storyletCall?.returnNodeId,
              } : newGraphId ? {
                targetGraphId: newGraphId,
                mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN,
                targetStartNodeId: node.storyletCall?.targetStartNodeId,
                returnNodeId: node.storyletCall?.returnNodeId,
              } : undefined,
            });
          }}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-detour-accent)] outline-none"
        >
          <option value="">Select storylet graph...</option>
          {storyletGraphs.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title || `Graph ${g.id}`}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Return Node ID</label>
        <input
          type="text"
          value={node.storyletCall?.returnNodeId || ''}
          onChange={(event) => {
            const returnNodeId = event.target.value || undefined;
            if (node.storyletCall?.targetGraphId) {
              onUpdate({
                storyletCall: {
                  ...node.storyletCall,
                  returnNodeId,
                },
              });
            }
          }}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-detour-accent)] outline-none"
          placeholder="return_node_id"
        />
      </div>
      
      <NextNodeSelector
        nodeId={node.id as string}
        nextNodeId={node.defaultNextNodeId}
        graph={graph}
        onUpdate={(updates) => onUpdate({ ...node, ...updates })}
        onFocusNode={onFocusNode}
      />
    </>
  );
}
