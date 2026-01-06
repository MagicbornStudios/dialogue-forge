import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DialogueNode, StoryletPoolItem } from '../types';
import { Shuffle, Hash, Percent } from 'lucide-react';
import { LayoutDirection } from '../utils/layout';

interface RandomizerDialogueNodeData {
  node: DialogueNode;
  storyletTitles?: Record<string, string>;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
}

export function RandomizerDialogueNodeV2({ data, selected }: NodeProps<RandomizerDialogueNodeData>) {
  const { 
    node, 
    storyletTitles = {},
    isDimmed, 
    isInPath, 
    layoutDirection = 'TB',
  } = data;

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const borderClass = selected 
    ? 'border-orange-400 shadow-lg shadow-orange-500/30'
    : 'border-orange-600/50';

  const pool = node.storyletPool || [];
  const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-orange-400/70' : ''} bg-gray-900 min-w-[300px] max-w-[400px] relative overflow-hidden`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-gray-700 !border-orange-500 !w-4 !h-4 !rounded-full"
      />
      
      <div className="bg-orange-900/40 border-b-2 border-orange-600/30 px-3 py-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-600/20 border-2 border-orange-500/50 flex items-center justify-center">
          <Shuffle size={20} className="text-orange-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">
              Randomizer
            </span>
            <span className="text-[10px] text-gray-500">
              {pool.length} storylet{pool.length !== 1 ? 's' : ''}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate mt-1">
            {node.content || 'Random Storylet'}
          </h3>
        </div>
        
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50 border border-gray-700" title={`Node ID: ${node.id}`}>
          <Hash size={10} className="text-gray-500" />
          <span className="text-[9px] font-mono text-gray-500">{node.id}</span>
        </div>
      </div>
      
      <div className="px-3 py-2">
        {pool.length === 0 ? (
          <div className="text-xs text-gray-500 italic py-2 text-center">
            No storylets in pool. Add storylets to randomize.
          </div>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pool.map((item, idx) => {
              const weight = item.weight || 1;
              const percentage = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
              const title = storyletTitles[item.storyletId] || item.storyletId;
              
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded text-xs"
                >
                  <Percent size={10} className="text-orange-400 flex-shrink-0" />
                  <span className="text-orange-300 font-medium w-8">{percentage}%</span>
                  <span className="text-gray-300 truncate flex-1">{title}</span>
                  {item.conditions && item.conditions.length > 0 && (
                    <span className="text-[9px] text-yellow-500 bg-yellow-500/10 px-1 rounded">
                      cond
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={sourcePosition} 
        id="next"
        className="!bg-gray-700 !border-orange-500 !w-4 !h-4 !rounded-full hover:!border-orange-400"
      />
    </div>
  );
}
