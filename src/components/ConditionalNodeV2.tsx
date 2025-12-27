import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { DialogueNode, Condition, ConditionalBlock } from '../types';
import { GitBranch, Play, Flag, Hash, Code } from 'lucide-react';
import { FlagSchema } from '../types/flags';
import { Character } from '../types/characters';
import { LayoutDirection } from '../utils/layout';

interface ConditionalNodeData {
  node: DialogueNode;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
  isStartNode?: boolean;
  isEndNode?: boolean;
}

// Color scheme for conditional block edges
const CONDITIONAL_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

export function ConditionalNodeV2({ data, selected }: NodeProps<ConditionalNodeData>) {
  const { node, flagSchema, characters = {}, isDimmed, isInPath, layoutDirection = 'TB', isStartNode, isEndNode } = data;
  const blocks = node.conditionalBlocks || [];
  const updateNodeInternals = useUpdateNodeInternals();
  const headerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [handlePositions, setHandlePositions] = useState<number[]>([]);
  
  // Handle positions based on layout direction
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

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

  // Border color based on state
  const borderClass = selected 
    ? 'border-df-conditional-border shadow-lg shadow-df-glow'
    : isStartNode 
      ? 'border-df-start shadow-md'
      : isEndNode 
        ? 'border-df-end shadow-md'
        : 'border-df-conditional-border';

  // Header background for conditional nodes
  const headerBgClass = isStartNode 
    ? 'bg-df-start-bg' 
    : isEndNode 
      ? 'bg-df-end-bg' 
      : 'bg-df-conditional-header';

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-df-conditional-border/70' : ''} bg-df-conditional-bg min-w-[320px] max-w-[450px] relative overflow-hidden`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      {/* Input handle - position based on layout direction */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
      />
      
      {/* Health Bar Style Header */}
      <div 
        ref={headerRef}
        className={`${headerBgClass} border-b-2 border-df-conditional-border px-3 py-2.5 flex items-center gap-3 relative`}
      >
        {/* Icon Placeholder - Left side (no avatar for conditional) */}
        <div className="w-14 h-14 rounded-full bg-df-conditional-bg border-[3px] border-df-conditional-border flex items-center justify-center shadow-lg flex-shrink-0">
          <Code size={20} className="text-df-conditional-selected" />
        </div>
        
        {/* Node Type Name - Center/Left */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-df-text-primary truncate leading-tight">
            Conditional Logic
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
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-conditional-selected/20 border border-df-conditional-selected/50" title="Conditional Node">
            <GitBranch size={14} className="text-df-conditional-selected" />
            <span className="text-[10px] font-semibold text-df-conditional-selected">IF/ELSE</span>
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
      
      {/* Conditional Blocks */}
      <div className="px-4 py-3">
        {blocks.map((block, idx) => {
          const color = CONDITIONAL_COLORS[idx % CONDITIONAL_COLORS.length];
          const blockType = block.type === 'if' ? 'IF' : block.type === 'elseif' ? 'ELSE IF' : 'ELSE';
          
          // Get character if characterId is set
          const character = block.characterId ? characters[block.characterId] : undefined;
          const displayName = character ? character.name : (block.speaker || undefined);
          const avatar = character?.avatar || '👤';
          
          return (
            <div
              key={block.id}
              ref={el => { blockRefs.current[idx] = el; }}
              className="px-3 py-2 border-b border-df-control-border last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-df-base text-df-text-primary font-semibold">
                  {blockType}
                </span>
                {block.condition && block.condition.length > 0 && (
                  <span className="text-[9px] text-df-text-secondary font-mono truncate flex-1">
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
              
              {/* Speaker/Character - Compact display */}
              {displayName && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm flex-shrink-0">{avatar}</span>
                  <span className="text-[10px] text-df-conditional-selected font-medium">{displayName}</span>
                </div>
              )}
              
              <div className="text-xs text-df-text-primary line-clamp-2 bg-df-elevated border border-df-control-border rounded px-3 py-1.5">
                &quot;{block.content.slice(0, 60) + (block.content.length > 60 ? '...' : '')}&quot;
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
                className="!bg-df-control-bg !border-df-control-border !w-3 !h-3 !rounded-full hover:!border-df-conditional-selected hover:!bg-df-conditional-selected/20"
              />
            </div>
          );
        })}
      </div>
      
      {/* Flag indicators */}
      {node.setFlags && node.setFlags.length > 0 && (
        <div className="px-4 py-2 border-t border-df-control-border flex flex-wrap gap-1">
          {node.setFlags.map(flagId => {
            const flag = flagSchema?.flags.find(f => f.id === flagId);
            const flagType = flag?.type || 'dialogue';
            const colorClass = flagType === 'dialogue' ? 'bg-df-flag-dialogue-bg text-df-flag-dialogue border-df-flag-dialogue' :
              flagType === 'quest' ? 'bg-df-flag-quest-bg text-df-flag-quest border-df-flag-quest' :
              flagType === 'achievement' ? 'bg-df-flag-achievement-bg text-df-flag-achievement border-df-flag-achievement' :
              flagType === 'item' ? 'bg-df-flag-item-bg text-df-flag-item border-df-flag-item' :
              flagType === 'stat' ? 'bg-df-flag-stat-bg text-df-flag-stat border-df-flag-stat' :
              flagType === 'title' ? 'bg-df-flag-title-bg text-df-flag-title border-df-flag-title' :
              flagType === 'global' ? 'bg-df-flag-global-bg text-df-flag-global border-df-flag-global' :
              'bg-df-flag-dialogue-bg text-df-flag-dialogue border-df-flag-dialogue';
            return (
              <span key={flagId} className={`text-[8px] px-1.5 py-0.5 rounded-full border ${colorClass}`} title={flag?.name || flagId}>
                {flagType === 'dialogue' ? 't' : flagType[0]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

