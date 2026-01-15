import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Play, Edit3, Plus } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import type { ShellNodeData } from '@/forge/components/GraphEditors/hooks/useForgeFlowEditorShell';
import { useForgeEditorActions } from '@/forge/components/GraphEditors/hooks/useForgeEditorActions';

/**
 * Start Node - represents the start of the narrative flow graph
 * This is not a "thread" concept, just the entry point to the narrative graph
 */
export function ThreadNode({ data, selected, id }: NodeProps<ShellNodeData>) {
  const { node, ui = {} } = data;
  const { isDimmed = false, isInPath = false, isStartNode = false } = ui;
  
  const title = node.label || 'Start';
  const summary = node.content;
  
  const actions = useForgeEditorActions();

  // Glow effect based on selection and path state - purple for start
  const glowClass = selected 
    ? 'shadow-[0_0_20px_rgba(139,92,246,0.6)]' // purple glow
    : isInPath 
      ? 'shadow-[0_0_12px_rgba(139,92,246,0.4)]' 
      : '';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onContextMenu={(e) => e.stopPropagation()}
          className={`min-w-[220px] max-w-[320px] rounded-lg border-2 shadow-sm bg-df-node-bg transition-all duration-200 ${
            selected ? 'border-violet-500' : 'border-df-node-border'
          } ${isDimmed ? 'opacity-30' : ''} ${glowClass}`}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
          />
          <div className="px-3 py-2 border-b border-df-node-border flex items-center gap-2 bg-violet-500/10">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-violet-500 border border-violet-500/30 bg-df-node-bg/40">
              <Play size={16} fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-violet-500/70">Start</div>
              <div className="text-sm font-semibold text-df-text-primary truncate">{title}</div>
            </div>
          </div>
          <div className="px-3 py-2 space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-df-text-tertiary">Node ID</div>
            <div className="text-xs font-mono text-df-text-secondary bg-df-base/40 border border-df-node-border rounded px-2 py-1">
              {id}
            </div>
            {summary && (
              <div className="text-xs text-df-text-secondary leading-relaxed">{summary}</div>
            )}
          </div>
          <Handle
            type="source"
            position={Position.Right}
            className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => actions.openNodeEditor(id!)}>
          <Edit3 size={14} className="mr-2 text-df-npc-selected" /> Edit Start Node
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {
          // Create ACT node - this will be handled by the editor's pane context menu or edge drop menu
          // For now, we'll just open the node editor
          actions.openNodeEditor(id!);
        }}>
          <Plus size={14} className="mr-2 text-df-player-selected" /> Add Act
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
