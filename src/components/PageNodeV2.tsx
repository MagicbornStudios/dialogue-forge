import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PageNode } from '../types/narrative';
import { FileText, MessageSquare, Bookmark } from 'lucide-react';
import { NarrativeReactFlowNodeData } from '../utils/narrative-converter';

export function PageNodeV2({ data, selected }: NodeProps<NarrativeReactFlowNodeData>) {
  const node = data.node as PageNode | null;
  if (!node) return null;

  const { hasDialogue, storyletCount } = data;

  const borderClass = selected
    ? 'border-emerald-400 shadow-lg shadow-emerald-400/30'
    : 'border-emerald-600/60 hover:border-emerald-500/80';

  const contentPreview = node.mainContent && node.mainContent.length > 60
    ? node.mainContent.slice(0, 60) + '...'
    : node.mainContent;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${borderClass} bg-gradient-to-br from-emerald-950/90 to-emerald-900/70 w-[180px] cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-emerald-600 !border-emerald-400 !w-3 !h-3 !rounded-full"
      />

      <div className="bg-gradient-to-r from-emerald-800/80 to-emerald-700/60 border-b border-emerald-600/50 px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center flex-shrink-0">
          <FileText size={12} className="text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Pg</span>
            <span className="text-[9px] text-emerald-500/70">#{(node.order || 0) + 1}</span>
          </div>
          <h3 className="text-xs font-bold text-emerald-100 truncate leading-tight">
            {node.title}
          </h3>
        </div>
      </div>

      <div className="px-3 py-2">
        {contentPreview && (
          <div className="bg-emerald-900/40 border border-emerald-600/30 rounded px-2 py-1.5 mb-2">
            <p className="text-[10px] text-emerald-200/80 leading-relaxed italic line-clamp-2">
              {contentPreview}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {hasDialogue && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-800/40 border border-cyan-500/30">
              <MessageSquare size={9} className="text-cyan-400" />
              <span className="text-[9px] text-cyan-300">Dialog</span>
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
        className="!bg-emerald-600 !border-emerald-400 !w-3 !h-3 !rounded-full hover:!bg-emerald-500"
      />
    </div>
  );
}
