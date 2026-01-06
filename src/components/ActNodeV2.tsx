import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ActNode } from '../types/narrative';
import { Clapperboard, MessageSquare, Bookmark } from 'lucide-react';
import { NarrativeReactFlowNodeData } from '../utils/narrative-converter';

export function ActNodeV2({ data, selected }: NodeProps<NarrativeReactFlowNodeData>) {
  const node = data.node as ActNode | null;
  if (!node) return null;

  const { chapterCount = 0, hasDialogue, storyletCount } = data;

  const borderClass = selected
    ? 'border-amber-400 shadow-lg shadow-amber-400/30'
    : 'border-amber-600/60 hover:border-amber-500/80';

  const descriptionPreview = node.description && node.description.length > 60
    ? node.description.slice(0, 60) + '...'
    : node.description;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${borderClass} bg-gradient-to-br from-amber-950/90 to-amber-900/70 w-[220px] cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-amber-600 !border-amber-400 !w-3 !h-3 !rounded-full"
      />

      <div className="bg-gradient-to-r from-amber-800/80 to-amber-700/60 border-b border-amber-600/50 px-3 py-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-900/80 border border-amber-500/50 flex items-center justify-center flex-shrink-0">
          <Clapperboard size={16} className="text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Act</span>
            <span className="text-[9px] text-amber-500/70">#{(node.order || 0) + 1}</span>
          </div>
          <h3 className="text-sm font-bold text-amber-100 truncate leading-tight">
            {node.title}
          </h3>
        </div>
      </div>

      <div className="px-3 py-2">
        {descriptionPreview && (
          <p className="text-[10px] text-amber-200/70 mb-2 leading-relaxed line-clamp-2">
            {descriptionPreview}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-800/40 border border-amber-600/30">
            <span className="text-[9px] text-amber-300">{chapterCount} Ch</span>
          </div>

          {hasDialogue && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-800/40 border border-blue-500/30">
              <MessageSquare size={9} className="text-blue-400" />
            </div>
          )}

          {storyletCount > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-800/40 border border-purple-500/30">
              <Bookmark size={9} className="text-purple-400" />
              <span className="text-[9px] text-purple-300">{storyletCount}</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-amber-600 !border-amber-400 !w-3 !h-3 !rounded-full hover:!bg-amber-500"
      />
    </div>
  );
}
