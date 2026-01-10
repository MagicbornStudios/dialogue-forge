import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Files } from 'lucide-react';
import type { NarrativeFlowNodeData } from '../../../../utils/narrative-converter';

export function PageNode({ data, selected }: NodeProps<NarrativeFlowNodeData>) {
  const title = data.element.title || data.element.id;
  const summary = data.element.summary;
  const isDimmed = data.isDimmed ?? false;
  const isInPath = data.isInPath ?? false;

  return (
    <div
      className={`min-w-[220px] max-w-[320px] rounded-lg border-2 shadow-sm bg-df-node-bg ${
        selected ? 'border-df-node-selected shadow-df-glow' : 'border-df-node-border'
      } ${isDimmed ? 'opacity-30' : ''} ${isInPath ? 'ring-2 ring-df-text-primary/50' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
      />
      <div className="px-3 py-2 border-b border-df-node-border flex items-center gap-2 bg-df-control-bg">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-df-text-primary border-df-node-border bg-df-node-bg/40">
          <Files size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Page</div>
          <div className="text-sm font-semibold text-df-text-primary truncate">{title}</div>
        </div>
      </div>
      <div className="px-3 py-2 space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-df-text-tertiary">ID</div>
        <div className="text-xs font-mono text-df-text-secondary bg-df-base/40 border border-df-node-border rounded px-2 py-1">
          {data.element.id}
        </div>
        {summary && (
          <div className="text-xs text-df-text-secondary leading-relaxed">{summary}</div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
      />
    </div>
  );
}
