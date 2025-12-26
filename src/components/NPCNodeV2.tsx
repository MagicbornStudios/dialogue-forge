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
  dialogue: 'bg-df-flag-dialogue-bg text-df-flag-dialogue border-df-flag-dialogue',
  quest: 'bg-df-flag-quest-bg text-df-flag-quest border-df-flag-quest',
  achievement: 'bg-df-flag-achievement-bg text-df-flag-achievement border-df-flag-achievement',
  item: 'bg-df-flag-item-bg text-df-flag-item border-df-flag-item',
  stat: 'bg-df-flag-stat-bg text-df-flag-stat border-df-flag-stat',
  title: 'bg-df-flag-title-bg text-df-flag-title border-df-flag-title',
  global: 'bg-df-flag-global-bg text-df-flag-global border-df-flag-global',
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
    ? 'border-df-npc-selected shadow-lg shadow-df-glow'
    : isStartNode 
      ? 'border-df-start shadow-md'
      : isEndNode 
        ? 'border-df-end shadow-md'
        : 'border-df-npc-border';

  // Header background based on node type
  const headerBgClass = isStartNode 
    ? 'bg-df-start-bg' 
    : isEndNode 
      ? 'bg-df-end-bg' 
      : 'bg-df-npc-header';

  // Content preview (truncated)
  const contentPreview = node.content.length > 60 
    ? node.content.slice(0, 60) + '...' 
    : node.content;

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-df-node-selected/70' : ''} bg-df-npc-bg min-w-[200px] relative`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      {/* Start badge */}
      {isStartNode && (
        <div className="absolute -top-2 -left-2 bg-df-start text-df-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
          <Play size={8} fill="currentColor" /> START
        </div>
      )}
      
      {/* End badge */}
      {isEndNode && (
        <div className="absolute -top-2 -right-2 bg-df-end text-df-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10">
          <Flag size={8} /> END
        </div>
      )}
      
      {/* Input handle */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
      />
      
      {/* Header */}
      <div className={`px-3 py-1.5 border-b border-df-control-border flex items-center gap-2 rounded-t-lg ${headerBgClass}`}>
        <MessageSquare size={12} className="text-df-npc-selected" />
        <span className="text-[10px] font-mono text-df-text-secondary truncate flex-1">{node.id}</span>
        <span className="text-[10px] text-df-text-tertiary">NPC</span>
      </div>
      
      {/* Content */}
      <div className="px-3 py-2 min-h-[50px]">
        {node.speaker && (
          <div className="text-[10px] text-df-npc-selected font-medium mb-1">{node.speaker}</div>
        )}
        <div className="text-xs text-df-text-primary line-clamp-2 bg-df-base border border-df-control-border rounded px-2 py-1">
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
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full hover:!border-df-npc-selected hover:!bg-df-npc-selected/20"
      />
    </div>
  );
}
