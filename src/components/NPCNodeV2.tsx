/**
 * NPCNodeV2 - React Flow node component for NPC dialogue
 * 
 * Displays:
 * - Node header with ID and type
 * - Speaker name (if present)
 * - Content preview (truncated)
 * - Flag indicators
 * - Start/End badges when applicable
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DialogueNode } from '../types';
import { MessageSquare, Play, Flag } from 'lucide-react';
import { FlagSchema } from '../types/flags';
import { LayoutDirection } from '../utils/layout';

// ============================================================================
// Types
// ============================================================================

interface NPCNodeData {
  node: DialogueNode;
  flagSchema?: FlagSchema;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
  isStartNode?: boolean;
  isEndNode?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const FLAG_COLORS: Record<string, string> = {
  dialogue: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  quest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  achievement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  item: 'bg-green-500/20 text-green-400 border-green-500/30',
  stat: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  title: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  global: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function getFlagColorClass(type: string): string {
  return FLAG_COLORS[type] || FLAG_COLORS.dialogue;
}

// ============================================================================
// Component
// ============================================================================

export function NPCNodeV2({ data, selected }: NodeProps<NPCNodeData>) {
  const { 
    node, 
    flagSchema, 
    isDimmed, 
    isInPath, 
    layoutDirection = 'TB', 
    isStartNode, 
    isEndNode 
  } = data;
  
  // Handle positions based on layout direction
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  // Border color based on state
  const borderClass = selected 
    ? 'border-[#e94560] shadow-lg shadow-[#e94560]/20'
    : isStartNode 
      ? 'border-green-500 shadow-md shadow-green-500/20'
      : isEndNode 
        ? 'border-amber-500 shadow-md shadow-amber-500/20'
        : 'border-[#4a1a1a]';

  // Header background based on node type
  const headerBgClass = isStartNode 
    ? 'bg-green-500/10' 
    : isEndNode 
      ? 'bg-amber-500/10' 
      : 'bg-[#12121a]';

  // Content preview (truncated)
  const contentPreview = node.content.length > 60 
    ? node.content.slice(0, 60) + '...' 
    : node.content;

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-[#e94560]/70' : ''} bg-[#1a1a2e] min-w-[200px] relative`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      {/* Start badge */}
      {isStartNode && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
          <Play size={8} fill="currentColor" /> START
        </div>
      )}
      
      {/* End badge */}
      {isEndNode && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
          <Flag size={8} /> END
        </div>
      )}
      
      {/* Input handle */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-[#2a2a3e] !border-[#4a4a6a] !w-4 !h-4 !rounded-full"
      />
      
      {/* Header */}
      <div className={`px-3 py-1.5 border-b border-[#2a2a3e] flex items-center gap-2 rounded-t-lg ${headerBgClass}`}>
        <MessageSquare size={12} className="text-[#e94560]" />
        <span className="text-[10px] font-mono text-gray-500 truncate flex-1">{node.id}</span>
        <span className="text-[10px] text-gray-600">NPC</span>
      </div>
      
      {/* Content */}
      <div className="px-3 py-2 min-h-[50px]">
        {node.speaker && (
          <div className="text-[10px] text-[#e94560] font-medium mb-1">{node.speaker}</div>
        )}
        <div className="text-xs text-gray-300 line-clamp-2 bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1">
          &quot;{contentPreview}&quot;
        </div>
        
        {/* Flag indicators */}
        {node.setFlags && node.setFlags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {node.setFlags.map((flagId: string) => {
              const flag = flagSchema?.flags.find((f: { id: string }) => f.id === flagId);
              const flagType = flag?.type || 'dialogue';
              return (
                <span 
                  key={flagId} 
                  className={`text-[8px] px-1 py-0.5 rounded border ${getFlagColorClass(flagType)}`} 
                  title={flag?.name || flagId}
                >
                  {flagType === 'dialogue' ? 't' : flagType[0]}
                </span>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Output handle */}
      <Handle 
        type="source" 
        position={sourcePosition} 
        id="next"
        className="!bg-[#2a2a3e] !border-[#4a4a6a] !w-4 !h-4 !rounded-full hover:!border-[#e94560] hover:!bg-[#e94560]/20"
      />
    </div>
  );
}
