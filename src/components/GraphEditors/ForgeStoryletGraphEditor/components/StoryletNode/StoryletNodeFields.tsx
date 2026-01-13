import React from 'react';
import { ForgeGraphDoc } from '../../../../../types';
import { NextNodeSelector } from '../../../shared/NodeEditor/components/NextNodeSelector';
import { ForgeNode, FORGE_STORYLET_CALL_MODE, type ForgeStoryletCallMode } from '@/src/types/forge/forge-graph';

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
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Template ID</label>
        <input
          type="text"
          value={node.storyletCall?.targetGraphId || ''}
          onChange={(event) => onUpdateStoryletCall({ targetGraphId: parseInt(event.target.value || '0') })}
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
