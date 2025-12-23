import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { DialogueNode, Choice } from '../types';
import { GitBranch, Play, Flag } from 'lucide-react';
import { FlagSchema } from '../types/flags';
import { LayoutDirection } from '../utils/layout';

interface PlayerNodeData {
  node: DialogueNode;
  flagSchema?: FlagSchema;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
  isStartNode?: boolean;
  isEndNode?: boolean;
}

// Color scheme for choice edges (same as current implementation)
const CHOICE_COLORS = ['#e94560', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

export function PlayerNodeV2({ data, selected }: NodeProps<PlayerNodeData>) {
  const { node, flagSchema, isDimmed, isInPath, layoutDirection = 'TB', isStartNode, isEndNode } = data;
  const choices = node.choices || [];
  const updateNodeInternals = useUpdateNodeInternals();
  const headerRef = useRef<HTMLDivElement>(null);
  const choiceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [handlePositions, setHandlePositions] = useState<number[]>([]);
  
  // Handle positions based on layout direction
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  // Calculate handle positions based on actual rendered heights
  useEffect(() => {
    if (headerRef.current && choices.length > 0) {
      const positions: number[] = [];
      const headerHeight = headerRef.current.offsetHeight;
      let cumulativeHeight = headerHeight;
      
      choices.forEach((_choice: Choice, idx: number) => {
        const choiceEl = choiceRefs.current[idx];
        if (choiceEl) {
          const choiceHeight = choiceEl.offsetHeight;
          const handleY = cumulativeHeight + (choiceHeight / 2);
          positions.push(handleY);
          cumulativeHeight += choiceHeight;
        } else {
          // Fallback: estimate height
          const estimatedHeight = 32; // py-1.5 (12px) + text (~16px) + flags (~4px) = ~32px
          const handleY = cumulativeHeight + (estimatedHeight / 2);
          positions.push(handleY);
          cumulativeHeight += estimatedHeight;
        }
      });
      
      setHandlePositions(positions);
      // Update React Flow internals after positions are calculated
      setTimeout(() => {
        updateNodeInternals(node.id);
      }, 0);
    }
  }, [choices, node.id, updateNodeInternals]);

  // Update node internals when choices change
  useEffect(() => {
    updateNodeInternals(node.id);
  }, [choices.length, node.id, updateNodeInternals]);

  // Check if this is an end node (player node with no choices that have nextNodeId)
  const hasNoOutgoingConnections = !choices.some(c => c.nextNodeId);

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${
        selected ? 'border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/20' : 
        isStartNode ? 'border-green-500 shadow-md shadow-green-500/20' :
        isEndNode ? 'border-amber-500 shadow-md shadow-amber-500/20' :
        'border-[#2a1a3a]'
      } ${isInPath ? 'border-[#8b5cf6]/70' : ''} bg-[#1e1e3a] min-w-[200px] relative`}
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
      <div 
        ref={headerRef}
        className="px-3 py-1.5 border-b border-[#2a2a3e] bg-[#16162a] flex items-center gap-2 rounded-t-lg"
      >
        <GitBranch size={12} className="text-purple-400" />
        <span className="text-[10px] font-mono text-gray-500 truncate flex-1">{node.id}</span>
        <span className="text-[10px] text-gray-600">PLAYER</span>
      </div>
      
      {/* Choices */}
      <div className="border-t border-[#2a2a3e]">
        {choices.map((choice, idx) => {
          // Use calculated position or fallback
          
          return (
            <div 
              key={choice.id} 
              ref={el => {
                choiceRefs.current[idx] = el;
              }}
              className="px-3 py-1.5 text-[10px] text-gray-400 flex items-center gap-2 border-b border-[#2a2a3e] last:border-0 relative"
            >
              <div className="flex-1 min-w-0">
                <span className="truncate block bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 text-gray-300">
                  &quot;{choice.text || 'Empty choice'}&quot;
                </span>
                
                {/* Choice flag indicators */}
                {choice.setFlags && choice.setFlags.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {choice.setFlags.map(flagId => {
                      const flag = flagSchema?.flags.find(f => f.id === flagId);
                      // If flag not found in schema, show as grey (dialogue/temporary)
                      // If flag found, use its type color, but dialogue flags should be grey
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
                        <span key={flagId} className={`text-[7px] px-0.5 py-0 rounded border ${colorClass}`} title={flag?.name || flagId}>
                          {flagType === 'dialogue' ? 't' : flagType[0]}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Dynamic handle for this choice - always on right for clarity */}
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${idx}`}
                style={{ 
                  top: `50%`,
                  transform: `translateY(-50%)`,
                  right: '-6px',
                }}
                className="!bg-[#2a2a3e] !border-2 hover:!border-[#e94560] hover:!bg-[#e94560]/20 !w-3 !h-3 !rounded-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

