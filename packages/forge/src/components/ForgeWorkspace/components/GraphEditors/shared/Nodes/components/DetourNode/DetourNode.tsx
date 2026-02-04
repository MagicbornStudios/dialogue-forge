import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CornerDownRight, Hash, ArrowLeftCircle, Edit3, Trash2, Home } from 'lucide-react';
import type { LayoutDirection } from '@magicborn/forge/lib/utils/layout/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@magicborn/shared/ui/context-menu';
import { useForgeEditorActions } from '@magicborn/forge/lib/graph-editor/hooks/useForgeEditorActions';
import type { ForgeNode } from '@magicborn/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { StandardNodeContextMenuItems } from '../shared/StandardNodeContextMenuItems';

interface DetourNodeData {
  node: ForgeNode;
  ui?: {
    isDimmed?: boolean;
    isInPath?: boolean;
    isStartNode?: boolean;
    isEndNode?: boolean;
    isDraftAdded?: boolean;
    isDraftUpdated?: boolean;
  };
  layoutDirection?: LayoutDirection;
}

export const DetourNode = React.memo(function DetourNode({ data, selected }: NodeProps<DetourNodeData>) {
  const { 
    node,
    ui = {},
    layoutDirection = 'TB' 
  } = data;
  const { isDimmed, isInPath, isStartNode, isEndNode, isDraftAdded, isDraftUpdated } = ui;
  
  const id = node.id || '';
  const title = node.label;
  const summary = node.content;
  const storyletId = node.storyletCall?.targetGraphId;
  const returnNodeId = node.storyletCall?.returnNodeId;
  
  const actions = useForgeEditorActions();
  const handleEdit = useCallback(() => {
    if (node.id) actions.openNodeEditor(node.id);
  }, [actions, node.id]);
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (node.id) actions.openNodeEditor(node.id);
  }, [actions, node.id]);
  const handleSetAsStart = useCallback(() => {
    if (node.id) actions.setStartNode(node.id);
  }, [actions, node.id]);
  const handleDelete = useCallback(() => {
    if (node.id) actions.deleteNode(node.id);
  }, [actions, node.id]);

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
  const nodeType = node.type ?? FORGE_NODE_TYPE.DETOUR;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          onContextMenu={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
          data-node-type={nodeType}
          data-selected={selected ? 'true' : 'false'}
          data-in-path={isInPath ? 'true' : 'false'}
          data-dimmed={isDimmed ? 'true' : 'false'}
          data-draft={isDraftAdded ? 'added' : isDraftUpdated ? 'modified' : undefined}
          data-start={isStartNode ? 'true' : 'false'}
          data-end={isEndNode ? 'true' : 'false'}
          className="forge-node rounded-lg border-2 transition-all duration-300 border-node bg-node text-node min-w-[280px] max-w-[350px] relative overflow-hidden"
        >
      <Handle 
        type="target" 
        position={targetPosition} 
        className="node-handle !w-4 !h-4 !rounded-full"
      />
      
      <div className="bg-node-header border-b-2 border-node px-3 py-2.5 flex items-center gap-3 relative">
        <div className="w-14 h-14 rounded-full bg-node border-[3px] border-node flex items-center justify-center shadow-lg flex-shrink-0">
          <CornerDownRight size={20} className="text-[var(--node-accent)]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate leading-tight">
            {title || 'Detour'}
          </h3>
          {summary && (
            <p className="text-xs text-[var(--color-df-text-secondary)] truncate mt-0.5">
              {summary}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-[color-mix(in_oklab,var(--color-df-base)_50%,transparent)] border border-border"
            title={`Node ID: ${id}`}
          >
            <Hash size={12} className="text-[var(--color-df-text-secondary)]" />
            <span className="text-[10px] font-mono text-[var(--color-df-text-secondary)]">{id}</span>
          </div>
          
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-[color-mix(in_oklab,var(--node-accent)_20%,transparent)] border border-[color-mix(in_oklab,var(--node-accent)_50%,transparent)]"
            title="Detour Node"
          >
            <CornerDownRight size={14} className="text-[var(--node-accent)]" />
            <span className="text-[10px] font-semibold text-[var(--node-accent)]">DETOUR</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-df-text-secondary)]">Storylet:</span>
          <span className="text-[var(--node-accent)] font-mono text-xs bg-[var(--color-df-base)] px-2 py-0.5 rounded border border-border">
            {storyletId ? String(storyletId) : 'Not set'}
          </span>
        </div>
        
        {returnNodeId && (
          <div className="flex items-center gap-2 text-sm">
            <ArrowLeftCircle size={14} className="text-[var(--color-df-text-secondary)]" />
            <span className="text-[var(--color-df-text-secondary)]">Returns to:</span>
            <span className="text-foreground font-mono text-xs bg-[var(--color-df-base)] px-2 py-0.5 rounded border border-border">
              {returnNodeId}
            </span>
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={sourcePosition} 
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
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

DetourNode.displayName = 'DetourNode';
