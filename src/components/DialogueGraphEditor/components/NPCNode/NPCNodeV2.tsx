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
import { Character } from '../types/characters';
import { MessageSquare, Play, Flag, Hash } from 'lucide-react';
import { FlagSchema } from '../types/flags';
import { LayoutDirection } from '../utils/layout';

// ============================================================================
// Types
// ============================================================================

interface NPCNodeData {
  node: DialogueNode;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
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
    characters = {},
    isDimmed, 
    isInPath, 
    layoutDirection = 'TB', 
    isStartNode, 
    isEndNode 
  } = data;

  // Get character if characterId is set
  const character = node.characterId ? characters[node.characterId] : undefined;
  const displayName = character ? character.name : (node.speaker || 'NPC');
  const avatar = character?.avatar || '👤';
  
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
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-df-node-selected/70' : ''} bg-df-npc-bg min-w-[320px] max-w-[450px] relative overflow-hidden`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      {/* Input handle */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
      />
      
      {/* Health Bar Style Header */}
      <div className={`${headerBgClass} border-b-2 border-df-npc-border px-3 py-2.5 flex items-center gap-3 relative`}>
        {/* Large Avatar - Left side */}
        <div className="w-14 h-14 rounded-full bg-df-npc-bg border-[3px] border-df-npc-border flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
          {avatar}
        </div>
        
        {/* Character Name - Center/Left */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-df-text-primary truncate leading-tight">
            {displayName}
          </h3>
        </div>
        
        {/* Metadata Icons - Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Node ID Icon */}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-base/50 border border-df-control-border" title={`Node ID: ${node.id}`}>
            <Hash size={12} className="text-df-text-secondary" />
            <span className="text-[10px] font-mono text-df-text-secondary">{node.id}</span>
          </div>
          
          {/* Type Icon */}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-npc-selected/20 border border-df-npc-selected/50" title="NPC Node">
            <MessageSquare size={14} className="text-df-npc-selected" />
            <span className="text-[10px] font-semibold text-df-npc-selected">NPC</span>
          </div>
        </div>
        
        {/* Start/End badge - Overlay on header */}
        {isStartNode && (
          <div className="absolute top-1 right-1 bg-df-start text-df-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg z-20">
            <Play size={8} fill="currentColor" /> START
          </div>
        )}
        {isEndNode && (
          <div className="absolute top-1 right-1 bg-df-end text-df-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg z-20">
            <Flag size={8} /> END
          </div>
        )}
      </div>
      
      {/* Dialogue Content */}
      <div className="px-4 py-3">
        <div className="bg-df-elevated border border-df-control-border rounded-lg px-4 py-3 mb-2">
          <p className="text-sm text-df-text-primary leading-relaxed">
            &quot;{contentPreview}&quot;
          </p>
        </div>
        
        {/* Flag indicators */}
        {node.setFlags && node.setFlags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {node.setFlags.map((flagId: string) => {
              const flag = flagSchema?.flags.find((f: { id: string }) => f.id === flagId);
              const flagType = flag?.type || 'dialogue';
              return (
                <span 
                  key={flagId} 
                  className={`text-[8px] px-1.5 py-0.5 rounded-full border ${getFlagColorClass(flagType)}`} 
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
