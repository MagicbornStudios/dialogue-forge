import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { ForgeGraphDoc } from '@/forge/types/forge-graph';
import { NextNodeSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/NodeEditor/NextNodeSelector';
import { ForgeNode, FORGE_STORYLET_CALL_MODE, type ForgeStoryletCallMode, FORGE_GRAPH_KIND } from '@/forge/types/forge-graph';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { Button } from '@/shared/ui/button';

interface StoryletNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  onUpdateStoryletCall: (updates: Partial<NonNullable<ForgeNode['storyletCall']>>) => void;
}

export function StoryletNodeFields({
  node,
  graph,
  onUpdate,
  onFocusNode,
  onUpdateStoryletCall,
}: StoryletNodeFieldsProps) {
  const workspaceActions = useForgeWorkspaceActions();
  const targetGraphId = node.storyletCall?.targetGraphId;
  
  // Get available storylet graphs from workspace store
  const allGraphs = useForgeWorkspaceStore(s => s.graphs.byId);
  const storyletGraphs = useMemo(() => 
    Object.values(allGraphs).filter(g => g.kind === FORGE_GRAPH_KIND.STORYLET),
    [allGraphs]
  );
  
  return (
    <>
      {targetGraphId && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => workspaceActions.openStoryletGraph(String(targetGraphId), { focusNodeId: node.storyletCall?.targetStartNodeId })}
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
          value={targetGraphId || ''}
          onChange={(event) => {
            const newGraphId = event.target.value ? parseInt(event.target.value) : undefined;
            onUpdateStoryletCall({ targetGraphId: newGraphId });
          }}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
        >
          <option value="">Select storylet graph...</option>
          {storyletGraphs.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title || `Graph ${g.id}`}
            </option>
          ))}
        </select>
        <div className="text-[9px] text-df-text-tertiary mt-1">
          Or enter Template ID manually below
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Template ID (Manual)</label>
        <input
          type="text"
          value={node.storyletCall?.targetGraphId || ''}
          onChange={(event) => onUpdateStoryletCall({ targetGraphId: parseInt(event.target.value || '0') || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="target_graph_id"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Flow Policy</label>
        <select
          value={node.storyletCall?.mode || ''}
          onChange={(event) => onUpdateStoryletCall({ mode: event.target.value as ForgeStoryletCallMode })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
        >
          <option value="">Select mode...</option>
          <option value={FORGE_STORYLET_CALL_MODE.DETOUR_RETURN}>{FORGE_STORYLET_CALL_MODE.DETOUR_RETURN}</option>
          <option value={FORGE_STORYLET_CALL_MODE.JUMP}>{FORGE_STORYLET_CALL_MODE.JUMP}</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Entry Node ID</label>
        <input
          type="text"
          value={node.storyletCall?.targetStartNodeId || ''}
          onChange={(event) => onUpdateStoryletCall({ targetStartNodeId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="target_start_node_id"
        />
      </div>

      <div>
        <label className="text-[10px] text-gray-500 uppercase">Return Node ID</label>
        <input
          type="text"
          value={node.storyletCall?.returnNodeId || ''}
          onChange={(event) => onUpdateStoryletCall({ returnNodeId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
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
