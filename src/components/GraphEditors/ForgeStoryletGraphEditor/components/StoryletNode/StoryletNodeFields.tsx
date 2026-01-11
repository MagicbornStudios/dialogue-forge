import React from 'react';
import { ForgeNode, ForgeGraph } from '../../../../types';
import { NextNodeSelector } from '../../shared/NodeEditor/components/NextNodeSelector';

interface StoryletNodeFieldsProps {
  node: ForgeNode;
  dialogue: ForgeGraph;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  onUpdateStoryletCall: (updates: Partial<NonNullable<ForgeNode['storyletCall']>>) => void;
}

export function StoryletNodeFields({
  node,
  dialogue,
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
          value={node.storyletCall?.templateId || ''}
          onChange={(event) => onUpdateStoryletCall({ templateId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="template_id"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Entry Policy</label>
        <input
          type="text"
          value={node.storyletCall?.entryPolicy || ''}
          onChange={(event) => onUpdateStoryletCall({ entryPolicy: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="entry_policy"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Entry Node ID</label>
        <input
          type="text"
          value={node.storyletCall?.entryNodeId || ''}
          onChange={(event) => onUpdateStoryletCall({ entryNodeId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="entry_node_id"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Return Policy</label>
        <input
          type="text"
          value={node.storyletCall?.returnPolicy || ''}
          onChange={(event) => onUpdateStoryletCall({ returnPolicy: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="return_policy"
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
        nodeId={node.id}
        nextNodeId={node.nextNodeId}
        dialogue={dialogue}
        onUpdate={onUpdate}
        onFocusNode={onFocusNode}
      />
    </>
  );
}
