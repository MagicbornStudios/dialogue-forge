import React, { useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { BookOpen, Edit3, Trash2, Plus } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import type { ShellNodeData } from '@/forge/lib/graph-editor/hooks/useForgeFlowEditorShell';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

export const ChapterNode = React.memo(function ChapterNode({ data, selected, id }: NodeProps<ShellNodeData>) {
  const { node, ui = {} } = data;
  const { isDimmed = false, isInPath = false } = ui;
  
  const title = node.label || id;
  const summary = node.content;
  
  const actions = useForgeEditorActions();
  const handleEdit = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleAddPage = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleDelete = useCallback(() => {
    if (id) actions.deleteNode(id);
  }, [actions, id]);
  const nodeType = node.type ?? FORGE_NODE_TYPE.CHAPTER;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onContextMenu={(e) => e.stopPropagation()}
          data-node-type={nodeType}
          data-selected={selected ? 'true' : 'false'}
          data-in-path={isInPath ? 'true' : 'false'}
          data-dimmed={isDimmed ? 'true' : 'false'}
          data-start="false"
          data-end="false"
          className="forge-node min-w-[220px] max-w-[320px] rounded-lg border-2 shadow-sm transition-all duration-200 border-node bg-node text-node"
        >
          <Handle
            type="target"
            position={Position.Left}
            className="node-handle !w-3 !h-3"
          />
          <div className="px-3 py-2 border-b border-node flex items-center gap-2 bg-node-header">
            <div className="h-8 w-8 rounded-full flex items-center justify-center border border-node bg-node">
              <BookOpen size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide">Chapter</div>
              <div className="text-sm font-semibold text-foreground truncate">{title}</div>
            </div>
          </div>
          <div className="px-3 py-2 space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--color-df-text-tertiary)]">ID</div>
            <div className="text-xs font-mono text-[var(--color-df-text-secondary)] bg-[color-mix(in_oklab,var(--color-df-base)_40%,transparent)] border border-border rounded px-2 py-1">
              {id}
            </div>
            {summary && (
              <div className="text-xs text-[var(--color-df-text-secondary)] leading-relaxed">{summary}</div>
            )}
          </div>
          <Handle
            type="source"
            position={Position.Right}
            className="node-handle !w-3 !h-3"
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={handleEdit}>
          <Edit3 size={14} className="mr-2 text-[var(--node-accent)]" /> Edit Chapter
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleAddPage}>
          <Plus size={14} className="mr-2 text-[var(--node-page-accent)]" /> Add Page
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onSelect={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 size={14} className="mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

ChapterNode.displayName = 'ChapterNode';
