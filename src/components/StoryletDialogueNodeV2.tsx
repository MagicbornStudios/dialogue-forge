import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DialogueNode } from '../types';
import { Bookmark, Hash, ArrowRight } from 'lucide-react';
import { LayoutDirection } from '../utils/layout';

interface StoryletDialogueNodeData {
  node: DialogueNode;
  storyletTitle?: string;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
}

export function StoryletDialogueNodeV2({ data, selected }: NodeProps<StoryletDialogueNodeData>) {
  const { 
    node, 
    storyletTitle,
    isDimmed, 
    isInPath, 
    layoutDirection = 'TB',
  } = data;

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const borderClass = selected 
    ? 'border-purple-400 shadow-lg shadow-purple-500/30'
    : 'border-purple-600/50';

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-purple-400/70' : ''} bg-gray-900 min-w-[280px] max-w-[350px] relative overflow-hidden`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-gray-700 !border-purple-500 !w-4 !h-4 !rounded-full"
      />
      
      <div className="bg-purple-900/40 border-b-2 border-purple-600/30 px-3 py-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-600/20 border-2 border-purple-500/50 flex items-center justify-center">
          <Bookmark size={20} className="text-purple-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
              Storylet
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate mt-1">
            {storyletTitle || 'Select Storylet...'}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50 border border-gray-700" title={`Node ID: ${node.id}`}>
          <Hash size={10} className="text-gray-500" />
          <span className="text-[9px] font-mono text-gray-500">{node.id}</span>
        </div>
      </div>
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ArrowRight size={12} className="text-purple-400" />
          <span>Plays storylet dialogue, then continues</span>
        </div>
        
        {node.storyletId && (
          <div className="mt-2 text-[10px] text-gray-500 font-mono bg-gray-800/50 px-2 py-1 rounded">
            ID: {node.storyletId}
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={sourcePosition} 
        id="next"
        className="!bg-gray-700 !border-purple-500 !w-4 !h-4 !rounded-full hover:!border-purple-400"
      />
    </div>
  );
}
