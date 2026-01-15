import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Files, Edit3, Trash2, FilePlus, BookPlus, LayoutList, MessageSquareText } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import type { ShellNodeData } from '@/forge/components/GraphEditors/hooks/useForgeFlowEditorShell';
import { useForgeEditorActions } from '@/forge/components/GraphEditors/hooks/useForgeEditorActions';

export function PageNode({ data, selected, id }: NodeProps<ShellNodeData>) {
  const { node, ui = {} } = data;
  const { isDimmed = false, isInPath = false } = ui;
  
  const title = node.label || id;
  const summary = node.content;
  
  const actions = useForgeEditorActions();

  // Glow effect based on selection and path state
  const glowClass = selected 
    ? 'shadow-[0_0_20px_rgba(245,158,11,0.6)]' // amber glow for pages
    : isInPath 
      ? 'shadow-[0_0_12px_rgba(245,158,11,0.4)]' 
      : '';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onContextMenu={(e) => e.stopPropagation()}
          className={`min-w-[220px] max-w-[320px] rounded-lg border-2 shadow-sm bg-df-node-bg transition-all duration-200 ${
            selected ? 'border-amber-500' : 'border-df-node-border'
          } ${isDimmed ? 'opacity-30' : ''} ${glowClass}`}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
          />
          <div className="px-3 py-2 border-b border-df-node-border flex items-center gap-2 bg-amber-500/10">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/30 bg-df-node-bg/40">
              <Files size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-amber-500/70">Page</div>
              <div className="text-sm font-semibold text-df-text-primary truncate">{title}</div>
            </div>
          </div>
          <div className="px-3 py-2 space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-df-text-tertiary">ID</div>
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

      <ContextMenuContent className="w-56">
        <ContextMenuItem onSelect={() => {
          // Add Page - this will be handled by edge drop menu or pane context menu
          actions.openNodeEditor(id!);
        }}>
          <FilePlus size={14} className="mr-2 text-df-page" /> Add Page
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {
          // Add Chapter - this will be handled by edge drop menu or pane context menu
          actions.openNodeEditor(id!);
        }}>
          <BookPlus size={14} className="mr-2 text-df-chapter" /> Add Chapter
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {
          // Add Act - this will be handled by edge drop menu or pane context menu
          actions.openNodeEditor(id!);
        }}>
          <LayoutList size={14} className="mr-2 text-df-act" /> Add Act
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => {
          // Edit Dialogue - this will be handled by workspace adapter in PR6
          actions.openNodeEditor(id!);
        }}>
          <MessageSquareText size={14} className="mr-2 text-df-npc-selected" /> Edit Dialogue
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => actions.openNodeEditor(id!)}>
          <Edit3 size={14} className="mr-2 text-df-text-secondary" /> Edit Page Details
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onSelect={() => actions.deleteNode(id!)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 size={14} className="mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
