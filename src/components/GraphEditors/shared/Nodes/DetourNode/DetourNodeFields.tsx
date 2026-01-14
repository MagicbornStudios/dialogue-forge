import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { ForgeGraphDoc } from '../../../../../types';
import { NextNodeSelector } from '../../../shared/NodeEditor/components/NextNodeSelector';
import { ForgeNode, FORGE_GRAPH_KIND } from '@/src/types/forge/forge-graph';
import { useForgeWorkspaceActions } from '@/src/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { useForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';
import { Button } from '@/src/components/ui/button';

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
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-storylet-selected outline-none"
          placeholder="Detour title"
        />
      </div>
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={node.content || ''}
          onChange={(event) => onUpdate({ content: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-storylet-selected outline-none min-h-[60px] resize-y"
          placeholder="Detour summary/description"
        />
      </div>
      
      {storyletId && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => workspaceActions.openStoryletGraph(String(storyletId))}
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
              storyletCall: newGraphId ? {
                targetGraphId: newGraphId,
                mode: node.storyletCall?.mode,
                targetStartNodeId: node.storyletCall?.targetStartNodeId,
                returnNodeId: node.storyletCall?.returnNodeId,
              } : undefined,
            });
          }}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-storylet-selected outline-none"
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
          onChange={(event) => onUpdate({
            storyletCall: {
              ...node.storyletCall,
              returnNodeId: event.target.value || undefined,
              targetGraphId: node.storyletCall?.targetGraphId,
            },
          })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-storylet-selected outline-none"
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
