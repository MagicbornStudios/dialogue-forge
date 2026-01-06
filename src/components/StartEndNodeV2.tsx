import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Flag } from 'lucide-react';
import { NarrativeReactFlowNodeData } from '../utils/narrative-converter';

export const StartNodeV2 = memo(function StartNodeV2({
  data,
  selected,
}: NodeProps<NarrativeReactFlowNodeData>) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        w-16 h-16
        rounded-full
        bg-gradient-to-br from-emerald-600 to-emerald-700
        border-2 ${selected ? 'border-white' : 'border-emerald-400'}
        shadow-lg shadow-emerald-900/50
        transition-all duration-200
        ${selected ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-gray-900' : ''}
      `}
    >
      <Play size={24} className="text-white fill-white" />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-600"
      />
    </div>
  );
});

export const EndNodeV2 = memo(function EndNodeV2({
  data,
  selected,
}: NodeProps<NarrativeReactFlowNodeData>) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        w-16 h-16
        rounded-full
        bg-gradient-to-br from-rose-600 to-rose-700
        border-2 ${selected ? 'border-white' : 'border-rose-400'}
        shadow-lg shadow-rose-900/50
        transition-all duration-200
        ${selected ? 'ring-2 ring-rose-300 ring-offset-2 ring-offset-gray-900' : ''}
      `}
    >
      <Flag size={24} className="text-white fill-white" />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-rose-400 !border-2 !border-rose-600"
      />
    </div>
  );
});
