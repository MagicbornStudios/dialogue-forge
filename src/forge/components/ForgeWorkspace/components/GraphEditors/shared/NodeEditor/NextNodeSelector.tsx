import React from 'react';
import { ForgeGraphDoc } from '@/forge/types/forge-graph';
import { EdgeIcon } from '../Nodes/components/shared/EdgeIcon';

interface NextNodeSelectorProps {
  nodeId: string;
  nextNodeId?: string;
  graph: ForgeGraphDoc;
  onUpdate: (updates: Partial<{ nextNodeId?: string }>) => void;
  onFocusNode?: (nodeId: string) => void;
  label?: string;
}

export function NextNodeSelector({
  nodeId,
  nextNodeId,
  graph,
  onUpdate,
  onFocusNode,
  label = 'Next Node',
}: NextNodeSelectorProps) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase">{label}</label>
      <div className="flex items-center gap-2">
        {nextNodeId && onFocusNode && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onFocusNode(nextNodeId);
            }}
            className="transition-colors cursor-pointer flex-shrink-0 group"
            title={`Focus on node: ${nextNodeId}`}
          >
            <EdgeIcon size={16} color="#2a2a3e" className="group-hover:[&_circle]:fill-[#2a2a3e] group-hover:[&_line]:stroke-[#2a2a3e] transition-colors" />
          </button>
        )}
        <select
          value={nextNodeId || ''}
          onChange={(event) => onUpdate({ nextNodeId: event.target.value || undefined })}
          className="flex-1 bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-sm text-gray-200 outline-none"
        >
          <option value="">— End —</option>
          {Object.keys(graph.flow?.nodes ?? {}).filter(id => id !== nodeId).map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
