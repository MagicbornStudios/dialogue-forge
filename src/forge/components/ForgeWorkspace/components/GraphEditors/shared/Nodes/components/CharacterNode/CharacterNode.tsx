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

import React, { useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ForgeCharacter } from '@/forge/types/characters';
import { MessageSquare, Play, Flag, Hash, Edit3, Plus, Trash2, Home } from 'lucide-react';
import { FlagSchema } from '@/forge/types/flags';
import { LayoutDirection } from '@/forge/lib/utils/layout/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { ForgeNode, FORGE_CONDITIONAL_BLOCK_TYPE, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { ShellNodeData } from '@/forge/lib/graph-editor/hooks/useForgeFlowEditorShell';

// ============================================================================
// Types
// ============================================================================

interface CharacterNodeData extends ShellNodeData{
  node: ForgeNode;
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
}

// ============================================================================
// Styles
// ============================================================================

import { getFlagColorClass } from '@/forge/lib/utils/flag-styles';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { StandardNodeContextMenuItems } from '../shared/StandardNodeContextMenuItems';

// ============================================================================
// Component
// ============================================================================

export const CharacterNode = React.memo(function CharacterNode({ data, selected }: NodeProps<CharacterNodeData>) {
  const { 
    node, 
    flagSchema,
    characters = {},
    ui = {},
    layoutDirection = 'TB',
  } = data;

  const { isDimmed, isInPath, isStartNode, isEndNode, isDraftAdded, isDraftUpdated } = ui;
  const setFlags = useMemo(() => node.setFlags ?? [], [node.setFlags]);


  // Use actions instead of callbacks
  const actions = useForgeEditorActions();
  const handleEdit = useCallback(() => {
    if (node.id) actions.openNodeEditor(node.id);
  }, [actions, node.id]);

  const handleSetAsStart = useCallback(() => {
    if (node.id) actions.setStartNode(node.id);
  }, [actions, node.id]);

  const handleAddConditionals = useCallback(() => {
    if (!node.id) return;
    actions.patchNode(node.id, {
      conditionalBlocks: [
        {
          id: `block_${Date.now()}`,
          type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
          condition: [],
          content: '',
          characterId: undefined,
          nextNodeId: undefined,
          setFlags: undefined,
        },
      ],
    });
    actions.openNodeEditor(node.id);
  }, [actions, node.id]);
  
  const handleDelete = useCallback(() => {
    if (node.id) actions.deleteNode(node.id);
  }, [actions, node.id]);

  // Get character if characterId is set
  const character = node.characterId ? characters[node.characterId] : undefined;
  const displayName = character ? character.name : (node.speaker || 'NPC');
  const avatar = character?.avatar || '👤';
  
  // Handle positions based on layout direction
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const nodeType = node.type ?? FORGE_NODE_TYPE.CHARACTER;

  // Content preview (truncated)
  const contentPreview = useMemo(() => {
    if (!node.content) return node.content;
    return node.content.length > 60 ? `${node.content.slice(0, 60)}...` : node.content;
  }, [node.content]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          onContextMenu={(e) => e.stopPropagation()}
          data-node-type={nodeType}
          data-selected={selected ? 'true' : 'false'}
          data-in-path={isInPath ? 'true' : 'false'}
          data-dimmed={isDimmed ? 'true' : 'false'}
          data-draft={isDraftAdded ? 'added' : isDraftUpdated ? 'modified' : undefined}
          data-start={isStartNode ? 'true' : 'false'}
          data-end={isEndNode ? 'true' : 'false'}
          className="forge-node rounded-lg border-2 transition-all duration-300 border-node bg-node text-node min-w-[320px] max-w-[450px] relative overflow-hidden"
        >
      {/* Input handle */}
      <Handle 
        type="target" 
        position={targetPosition} 
        className="node-handle !w-4 !h-4 !rounded-full"
      />
      
      {/* Health Bar Style Header */}
      <div className="bg-node-header border-b-2 border-node px-3 py-2.5 flex items-center gap-3 relative">
        {/* Large Avatar - Left side */}
        <div className="w-14 h-14 rounded-full bg-node border-[3px] border-node flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
          {avatar}
        </div>
        
        {/* Character Name - Center/Left */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate leading-tight">
            {displayName}
          </h3>
        </div>
        
        {/* Metadata Icons - Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Node ID Icon */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-[color-mix(in_oklab,var(--color-df-base)_50%,transparent)] border border-border"
            title={`Node ID: ${node.id}`}
          >
            <Hash size={12} className="text-[var(--color-df-text-secondary)]" />
            <span className="text-[10px] font-mono text-[var(--color-df-text-secondary)]">{node.id}</span>
          </div>
          
          {/* Type Icon */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-[color-mix(in_oklab,var(--node-accent)_20%,transparent)] border border-[color-mix(in_oklab,var(--node-accent)_50%,transparent)]"
            title="NPC Node"
          >
            <MessageSquare size={14} className="text-[var(--node-accent)]" />
            <span className="text-[10px] font-semibold text-[var(--node-accent)]">NPC</span>
          </div>
        </div>
        
        {/* Start/End badge - Overlay on header */}
        {isStartNode && (
          <div className="absolute top-1 right-1 bg-[var(--node-start-border)] text-foreground text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg z-20">
            <Play size={8} fill="currentColor" /> START
          </div>
        )}
        {isEndNode && (
          <div className="absolute top-1 right-1 bg-[var(--node-end-border)] text-foreground text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg z-20">
            <Flag size={8} /> END
          </div>
        )}
      </div>
      
      {/* Dialogue Content */}
      <div className="px-4 py-3">
        <div className="bg-card border border-border rounded-lg px-4 py-3 mb-2">
          <p className="text-sm text-foreground leading-relaxed">
            &quot;{contentPreview}&quot;
          </p>
        </div>
        
        {/* Flag indicators */}
        {setFlags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {setFlags.map((flagId: string) => {
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
        className="node-handle !w-4 !h-4 !rounded-full"
      />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <StandardNodeContextMenuItems
          nodeId={node.id}
          isStartNode={isStartNode}
          onEdit={handleEdit}
          onSetAsStart={handleSetAsStart}
          onDelete={handleDelete}
          afterEditItems={
            node.id ? (
              <ContextMenuItem onSelect={handleAddConditionals}>
                <Plus size={14} className="mr-2 text-[var(--node-conditional-accent)]" /> Add Conditionals
              </ContextMenuItem>
            ) : undefined
          }
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

CharacterNode.displayName = 'CharacterNode';
