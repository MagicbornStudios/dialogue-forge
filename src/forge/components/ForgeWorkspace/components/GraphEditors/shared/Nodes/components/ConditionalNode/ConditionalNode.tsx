import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import type { ForgeCondition, ForgeConditionalBlock, ForgeNode } from '@/forge/types/forge-graph';
import { FORGE_CONDITIONAL_BLOCK_TYPE, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { GitBranch, Play, Flag, Hash, Code, Edit3, Trash2, Plus } from 'lucide-react';
import { FlagSchema } from '@/forge/types/flags';
import { ForgeCharacter } from '@/forge/types/characters';
import { LayoutDirection } from '@/forge/lib/utils/layout/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { getFlagColorClass } from '@/forge/lib/utils/flag-styles';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { CONDITION_OPERATOR } from '@/forge/types/constants';
import { CONDITION_OPERATOR_SYMBOLS } from '@/forge/types/constants';
import { formatCondition } from '@/forge/lib/yarn-converter/utils/condition-formatter';

interface ConditionalNodeData {
  node: ForgeNode;
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  ui?: {
    isDimmed?: boolean;
    isInPath?: boolean;
    isStartNode?: boolean;
    isEndNode?: boolean;
  };
  layoutDirection?: LayoutDirection;
}

export function ConditionalNode({ data, selected }: NodeProps<ConditionalNodeData>) {
  const { node, flagSchema, characters = {}, ui = {}, layoutDirection = 'TB' } = data;
  const { isDimmed, isInPath, isStartNode, isEndNode } = ui;
  const blocks = node.conditionalBlocks || [];

  // Use actions instead of callbacks
  const actions = useForgeEditorActions();
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

      blocks.forEach((_block: ForgeConditionalBlock, idx: number) => {
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
        updateNodeInternals(node.id as string);
      }, 0);
    }
  }, [blocks.length, node.id, updateNodeInternals]);

  const nodeType = node.type ?? FORGE_NODE_TYPE.CONDITIONAL;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onContextMenu={(e) => e.stopPropagation()}
          data-node-type={nodeType}
          data-selected={selected ? 'true' : 'false'}
          data-in-path={isInPath ? 'true' : 'false'}
          data-dimmed={isDimmed ? 'true' : 'false'}
          data-start={isStartNode ? 'true' : 'false'}
          data-end={isEndNode ? 'true' : 'false'}
          className="forge-node rounded-lg border-2 transition-all duration-300 border-node bg-node text-node min-w-[320px] max-w-[450px] relative overflow-hidden"
        >
          {/* Input handle - position based on layout direction */}
          <Handle
            type="target"
            position={targetPosition}
            className="node-handle !w-4 !h-4 !rounded-full"
          />

          {/* Health Bar Style Header */}
          <div
            ref={headerRef}
            className="bg-node-header border-b-2 border-node px-3 py-2.5 flex items-center gap-3 relative"
          >
            {/* Icon Placeholder - Left side (no avatar for conditional) */}
            <div className="w-14 h-14 rounded-full bg-node border-[3px] border-node flex items-center justify-center shadow-lg flex-shrink-0">
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
              const blockType = block.type === FORGE_CONDITIONAL_BLOCK_TYPE.IF ? 'IF' : block.type === FORGE_CONDITIONAL_BLOCK_TYPE.ELSE_IF ? 'ELSE IF' : 'ELSE';

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
                        {block.condition.map((condition: ForgeCondition) => {
                          return formatCondition(condition);
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
                    &quot;{block.content?.slice(0, 60) + (block.content?.length && block.content.length > 60 ? '...' : '')}&quot;
                  </div>

                  {/* Output handle for each block */}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`block-${idx}`}
                    data-choice-index={idx % 5}
                    style={{
                      top: `${handlePositions[idx] || 0}px`,
                      right: -8,
                    }}
                    className="forge-choice-handle !w-3 !h-3 !rounded-full"
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
                const colorClass = getFlagColorClass(flagType);
                return (
                  <span key={flagId} className={`text-[8px] px-1.5 py-0.5 rounded-full border ${colorClass}`} title={flag?.name || flagId}>
                    {flagType === 'dialogue' ? 't' : flagType[0]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => node.id && actions.openNodeEditor(node.id)}>
          <Edit3 size={14} className="mr-2 text-df-npc-selected" /> Edit Node
        </ContextMenuItem>
        {!isStartNode && node.id && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => node.id && actions.deleteNode(node.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 size={14} className="mr-2" /> Delete
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => {
          if (!node.id) return;
          const currentBlocks = node.conditionalBlocks || [];
          const newBlock = {
            id: `block_${Date.now()}`,
            type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
            condition: [],
            content: '',
            speaker: undefined,
          };
          actions.patchNode(node.id, {
            conditionalBlocks: [...currentBlocks, newBlock],
          });
          actions.openNodeEditor(node.id);
        }}>
          <Plus size={14} className="mr-2 text-df-npc-selected" /> Add Conditional Block
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
