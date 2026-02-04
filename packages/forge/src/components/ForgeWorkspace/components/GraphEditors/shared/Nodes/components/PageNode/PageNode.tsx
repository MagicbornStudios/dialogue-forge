import React, { useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Files, FilePlus, BookPlus, LayoutList, MessageSquareText } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@magicborn/shared/ui/context-menu';
import type { ShellNodeData } from '@magicborn/forge/lib/graph-editor/hooks/useForgeFlowEditorShell';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { useForgeEditorActions } from '@magicborn/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { StandardNodeContextMenuItems } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/StandardNodeContextMenuItems';

export const PageNode = React.memo(function PageNode({ data, selected, id }: NodeProps<ShellNodeData>) {
  const { node, ui = {} } = data;
  const { isDimmed = false, isInPath = false, isStartNode = false, isDraftAdded, isDraftUpdated } = ui;
  
  const title = node.label || id;
  const summary = node.content;
  
  const actions = useForgeEditorActions();
  const handleAddPage = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleAddChapter = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleAddAct = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleEditDialogue = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleEditPage = useCallback(() => {
    if (id) actions.openNodeEditor(id);
  }, [actions, id]);
  const handleSetAsStart = useCallback(() => {
    if (id) actions.setStartNode(id);
  }, [actions, id]);
  const handleDelete = useCallback(() => {
    if (id) actions.deleteNode(id);
  }, [actions, id]);
  const nodeType = node.type ?? FORGE_NODE_TYPE.PAGE;

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
              <Files size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide">Page</div>
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

      <ContextMenuContent className="w-56">
        <StandardNodeContextMenuItems
          nodeId={id}
          isStartNode={isStartNode}
          onEdit={handleEditPage}
          onSetAsStart={handleSetAsStart}
          onDelete={handleDelete}
          editLabel="Edit Page Details"
          beforeStandardItems={
            <>
              <ContextMenuItem onSelect={handleAddPage}>
                <FilePlus size={14} className="mr-2 text-[var(--node-page-accent)]" /> Add Page
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleAddChapter}>
                <BookPlus size={14} className="mr-2 text-[var(--node-chapter-accent)]" /> Add Chapter
              </ContextMenuItem>
              <ContextMenuItem onSelect={handleAddAct}>
                <LayoutList size={14} className="mr-2 text-[var(--node-act-accent)]" /> Add Act
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={handleEditDialogue}>
                <MessageSquareText size={14} className="mr-2 text-[var(--node-npc-accent)]" /> Edit Dialogue
              </ContextMenuItem>
            </>
          }
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

PageNode.displayName = 'PageNode';
