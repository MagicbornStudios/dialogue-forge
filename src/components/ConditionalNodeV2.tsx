import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { DialogueNode, Condition, ConditionalBlock } from '../types';
import { GitBranch, Play, Flag } from 'lucide-react';
import { FlagSchema } from '../types/flags';
import { LayoutDirection } from '../utils/layout';

interface ConditionalNodeData {
  node: DialogueNode;
  flagSchema?: FlagSchema;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
  isStartNode?: boolean;
  isEndNode?: boolean;
}

// Color scheme for conditional block edges
const CONDITIONAL_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

export function ConditionalNodeV2({ data, selected }: NodeProps<ConditionalNodeData>) {
  const { node, flagSchema, isDimmed, isInPath, layoutDirection = 'TB', isStartNode, isEndNode } = data;
  const blocks = node.conditionalBlocks || [];
  const updateNodeInternals = useUpdateNodeInternals();
  const headerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [handlePositions, setHandlePositions] = useState<number[]>([]);
  
  // Handle positions based on layout direction
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;

  // Calculate handle positions based on actual rendered heights
  useEffect(() => {
    if (headerRef.current && blocks.length > 0) {
      const positions: number[] = [];
      const headerHeight = headerRef.current.offsetHeight;
      let cumulativeHeight = headerHeight;
      
      blocks.forEach((_block: ConditionalBlock, idx: number) => {
        const blockEl = blockRefs.current[idx];
        if (blockEl) {
          const blockHeight = blockEl.offsetHeight;
          const handleY = cumulativeHeight + (blockHeight / 2);
          positions.push(handleY);
          cumulativeHeight += blockHeight;
        } else {
          // Fallback: estimate height
          const estimatedHeight = 40;
          const handleY = cumulativeHeight + (estimatedHeight / 2);
          positions.push(handleY);
          cumulativeHeight += estimatedHeight;
        }
      });
      
      setHandlePositions(positions);
      setTimeout(() => {
        updateNodeInternals(node.id);
      }, 0);
    }
  }, [blocks.length, node.id, updateNodeInternals]);

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${
        selected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 
        isStartNode ? 'border-green-500 shadow-md shadow-green-500/20' :
        isEndNode ? 'border-amber-500 shadow-md shadow-amber-500/20' :
        'border-[#1a1a4a]'
      } ${isInPath ? 'border-blue-500/70' : ''} bg-[#1a1a2e] min-w-[200px] relative`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      {/* Start/End badge */}
      {isStartNode && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
          <Play size={8} fill="currentColor" /> START
        </div>
      )}
      {isEndNode && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
          <Flag size={8} /> END
        </div>
      )}
      
      {/* Input handle - position based on layout direction */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-[#2a2a3e] !border-[#4a4a6a] !w-4 !h-4 !rounded-full"
      />
      
      {/* Header */}
      <div ref={headerRef} className="px-3 py-1.5 border-b border-[#2a2a3e] bg-[#12121a] flex items-center gap-2 rounded-t-lg">
        <GitBranch size={12} className="text-blue-400" />
        <span className="text-[10px] font-mono text-gray-500 truncate flex-1">{node.id}</span>
        <span className="text-[10px] text-blue-400">IF/ELSE</span>
      </div>
      
      {/* Conditional Blocks */}
      <div className="py-1">
        {blocks.map((block, idx) => {
          const color = CONDITIONAL_COLORS[idx % CONDITIONAL_COLORS.length];
          const blockType = block.type === 'if' ? 'IF' : block.type === 'elseif' ? 'ELSE IF' : 'ELSE';
          
          return (
            <div
              key={block.id}
              ref={el => { blockRefs.current[idx] = el; }}
              className="px-3 py-1.5 border-b border-[#2a2a3e] last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-white font-semibold">
                  {blockType}
                </span>
                {block.condition && block.condition.length > 0 && (
                  <span className="text-[9px] text-gray-500 font-mono truncate flex-1">
                    {block.condition.map((c: Condition) => {
                      const varName = `$${c.flag}`;
                      if (c.operator === 'is_set') return varName;
                      if (c.operator === 'is_not_set') return `not ${varName}`;
                      if (c.value !== undefined) {
                        const op = c.operator === 'equals' ? '==' :
                                  c.operator === 'not_equals' ? '!=' :
                                  c.operator === 'greater_than' ? '>' :
                                  c.operator === 'less_than' ? '<' :
                                  c.operator === 'greater_equal' ? '>=' :
                                  c.operator === 'less_equal' ? '<=' : '==';
                        const value = typeof c.value === 'string' ? `"${c.value}"` : c.value;
                        return `${varName} ${op} ${value}`;
                      }
                      return '';
                    }).filter(c => c).join(' and ').slice(0, 30)}
                  </span>
                )}
              </div>
              {block.speaker && (
                <div className="text-[9px] text-blue-400 font-medium">{block.speaker}</div>
              )}
              <div className="text-[10px] text-gray-300 line-clamp-1 bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 mt-1">
                &quot;{block.content.slice(0, 40) + (block.content.length > 40 ? '...' : '')}&quot;
              </div>
              
              {/* Output handle for each block */}
              <Handle
                type="source"
                position={Position.Right}
                id={`block-${idx}`}
                style={{
                  top: `${handlePositions[idx] || 0}px`,
                  right: -8,
                }}
                className="!bg-[#2a2a3e] !border-[#4a4a6a] !w-3 !h-3 !rounded-full hover:!border-blue-400 hover:!bg-blue-400/20"
              />
            </div>
          );
        })}
      </div>
      
      {/* Flag indicators */}
      {node.setFlags && node.setFlags.length > 0 && (
        <div className="px-3 py-1 border-t border-[#2a2a3e] flex flex-wrap gap-1">
          {node.setFlags.map(flagId => {
            const flag = flagSchema?.flags.find(f => f.id === flagId);
            const flagType = flag?.type || 'dialogue';
            const colorClass = flagType === 'dialogue' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
              flagType === 'quest' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              flagType === 'achievement' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              flagType === 'item' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              flagType === 'stat' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
              flagType === 'title' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
              flagType === 'global' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              'bg-gray-500/20 text-gray-400 border-gray-500/30';
            return (
              <span key={flagId} className={`text-[8px] px-1 py-0.5 rounded border ${colorClass}`} title={flag?.name || flagId}>
                {flagType === 'dialogue' ? 't' : flagType[0]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

