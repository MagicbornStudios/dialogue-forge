import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CornerDownRight, Hash, ArrowLeftCircle, Edit3, Trash2 } from 'lucide-react';
import type { LayoutDirection } from '@/forge/components/GraphEditors/utils/layout/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { useForgeEditorActions } from '@/forge/components/GraphEditors/hooks/useForgeEditorActions';
import type { ForgeNode } from '@/forge/types/forge-graph';

interface DetourNodeData {
  node: ForgeNode;
  ui?: {
    isDimmed?: boolean;
    isInPath?: boolean;
    isStartNode?: boolean;
    isEndNode?: boolean;
  };
  layoutDirection?: LayoutDirection;
}

export function DetourNode({ data, selected }: NodeProps<DetourNodeData>) {
  const { 
    node,
    ui = {},
    layoutDirection = 'TB' 
  } = data;
  const { isDimmed, isInPath, isStartNode, isEndNode } = ui;
  
  const id = node.id || '';
  const title = node.label;
  const summary = node.content;
  const storyletId = node.storyletCall?.targetGraphId;
  const returnNodeId = node.storyletCall?.returnNodeId;
  
  const actions = useForgeEditorActions();

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const borderClass = selected 
    ? 'border-df-storylet-border shadow-lg shadow-df-glow'
    : 'border-df-storylet-border';

  const headerBgClass = 'bg-df-storylet-header';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          onContextMenu={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (node.id) actions.openNodeEditor(node.id);
          }}
          className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-df-storylet-border/70' : ''} bg-df-storylet-bg min-w-[280px] max-w-[350px] relative overflow-hidden`}
          style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
        >
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
      />
      
      <div className={`${headerBgClass} border-b-2 border-df-storylet-border px-3 py-2.5 flex items-center gap-3 relative`}>
        <div className="w-14 h-14 rounded-full bg-df-storylet-bg border-[3px] border-df-storylet-border flex items-center justify-center shadow-lg flex-shrink-0">
          <CornerDownRight size={20} className="text-df-storylet-selected" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-df-text-primary truncate leading-tight">
            {title || 'Detour'}
          </h3>
          {summary && (
            <p className="text-xs text-df-text-secondary truncate mt-0.5">
              {summary}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-base/50 border border-df-control-border" title={`Node ID: ${id}`}>
            <Hash size={12} className="text-df-text-secondary" />
            <span className="text-[10px] font-mono text-df-text-secondary">{id}</span>
          </div>
          
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-storylet-selected/20 border border-df-storylet-selected/50" title="Detour Node">
            <CornerDownRight size={14} className="text-df-storylet-selected" />
            <span className="text-[10px] font-semibold text-df-storylet-selected">DETOUR</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-df-text-secondary">Storylet:</span>
          <span className="text-df-storylet-selected font-mono text-xs bg-df-base px-2 py-0.5 rounded border border-df-control-border">
            {storyletId ? String(storyletId) : 'Not set'}
          </span>
        </div>
        
        {returnNodeId && (
          <div className="flex items-center gap-2 text-sm">
            <ArrowLeftCircle size={14} className="text-df-text-secondary" />
            <span className="text-df-text-secondary">Returns to:</span>
            <span className="text-df-text-primary font-mono text-xs bg-df-base px-2 py-0.5 rounded border border-df-control-border">
              {returnNodeId}
            </span>
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={sourcePosition} 
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
      />
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
      </ContextMenuContent>
    </ContextMenu>
  );
}
