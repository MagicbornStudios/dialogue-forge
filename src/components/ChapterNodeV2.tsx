import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChapterNode } from '../types/narrative';
import { BookOpen, MessageSquare, Bookmark } from 'lucide-react';
import { NarrativeReactFlowNodeData } from '../utils/narrative-converter';

export function ChapterNodeV2({ data, selected }: NodeProps<NarrativeReactFlowNodeData>) {
  const node = data.node as ChapterNode | null;
  if (!node) return null;

  const { pageCount = 0, hasDialogue, storyletCount } = data;

  const borderClass = selected
    ? 'border-blue-400 shadow-lg shadow-blue-400/30'
    : 'border-blue-600/60 hover:border-blue-500/80';

  const descriptionPreview = node.description && node.description.length > 50
    ? node.description.slice(0, 50) + '...'
    : node.description;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${borderClass} bg-gradient-to-br from-blue-950/90 to-blue-900/70 w-[200px] cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-600 !border-blue-400 !w-3 !h-3 !rounded-full"
      />

      <div className="bg-gradient-to-r from-blue-800/80 to-blue-700/60 border-b border-blue-600/50 px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-900/80 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
          <BookOpen size={14} className="text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Ch</span>
            <span className="text-[9px] text-blue-500/70">#{(node.order || 0) + 1}</span>
          </div>
          <h3 className="text-xs font-bold text-blue-100 truncate leading-tight">
            {node.title}
          </h3>
        </div>
      </div>

      <div className="px-3 py-2">
        {descriptionPreview && (
          <p className="text-[10px] text-blue-200/70 mb-2 leading-relaxed line-clamp-2">
            {descriptionPreview}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-800/40 border border-blue-600/30">
            <span className="text-[9px] text-blue-300">{pageCount} Pg</span>
          </div>

          {hasDialogue && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-800/40 border border-emerald-500/30">
              <MessageSquare size={9} className="text-emerald-400" />
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
        className="!bg-blue-600 !border-blue-400 !w-3 !h-3 !rounded-full hover:!bg-blue-500"
      />
    </div>
  );
}
