import React, { useCallback, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Hash, BookOpen, Flag, Play, ExternalLink } from 'lucide-react';
import type { FlagSchema } from '@/forge/types/flags';
import type { LayoutDirection } from '@/forge/lib/utils/layout/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';

import type { ForgeNode } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { getFlagColorClass } from '@/forge/lib/utils/flag-styles';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { StandardNodeContextMenuItems } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/StandardNodeContextMenuItems';

interface StoryletNodeData {
  node: ForgeNode;
  flagSchema?: FlagSchema;
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

export const StoryletNode = React.memo(function StoryletNode({ data, selected }: NodeProps<StoryletNodeData>) {
  const { node, flagSchema, ui = {}, layoutDirection = 'TB' } = data;
  const { isDimmed, isInPath, isStartNode, isEndNode, isDraftAdded, isDraftUpdated } = ui;
  const setFlags = useMemo(() => node.setFlags ?? [], [node.setFlags]);

  const actions = useForgeEditorActions();
  const workspaceActions = useForgeWorkspaceActions();
  const handleEdit = useCallback(() => {
    if (node.id) actions.openNodeEditor(node.id);
  }, [actions, node.id]);
  const handleSetAsStart = useCallback(() => {
    if (node.id) actions.setStartNode(node.id);
  }, [actions, node.id]);
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (node.id) actions.openNodeEditor(node.id);
  }, [actions, node.id]);
  const handleOpenStorylet = useCallback(() => {
    if (node.storyletCall?.targetGraphId) {
      workspaceActions.openStoryletGraph(String(node.storyletCall.targetGraphId), {
        focusNodeId: node.storyletCall?.targetStartNodeId,
      });
    }
  }, [node.storyletCall?.targetGraphId, node.storyletCall?.targetStartNodeId, workspaceActions]);
  const handleDelete = useCallback(() => {
    if (node.id) actions.deleteNode(node.id);
  }, [actions, node.id]);

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const nodeType = node.type ?? FORGE_NODE_TYPE.STORYLET;

  const contentPreview = useMemo(() => {
    if (!node.content) return 'No description yet.';
    return node.content.length > 60 ? `${node.content.slice(0, 60)}...` : node.content;
  }, [node.content]);

  const graphId = node.storyletCall?.targetGraphId;
  const returnNodeId = node.storyletCall?.returnNodeId;

  const canDelete = !!node.id && !isStartNode;

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
          className="forge-node rounded-lg border-2 transition-all duration-300 border-node bg-node text-node min-w-[320px] max-w-[450px] relative overflow-hidden"
        >
          <Handle
            type="target"
            position={targetPosition}
            className="node-handle !w-4 !h-4 !rounded-full"
          />

          <div className="bg-node-header border-b-2 border-node px-3 py-2.5 flex items-center gap-3 relative">
            <div className="w-14 h-14 rounded-full bg-node border-[3px] border-node flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
              <BookOpen size={20} className="text-[var(--node-accent)]" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate leading-tight">Storylet</h3>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded bg-[color-mix(in_oklab,var(--color-df-base)_50%,transparent)] border border-border"
                title={`Node ID: ${node.id}`}
              >
                <Hash size={12} className="text-[var(--color-df-text-secondary)]" />
                <span className="text-[10px] font-mono text-[var(--color-df-text-secondary)]">{node.id}</span>
              </div>

              <div
                className="flex items-center gap-1 px-2 py-1 rounded bg-[color-mix(in_oklab,var(--node-accent)_20%,transparent)] border border-[color-mix(in_oklab,var(--node-accent)_50%,transparent)]"
                title="Storylet Node"
              >
                <BookOpen size={14} className="text-[var(--node-accent)]" />
                <span className="text-[10px] font-semibold text-[var(--node-accent)]">STORYLET</span>
              </div>
            </div>

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

          <div className="px-4 py-3 space-y-2">
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <p className="text-sm text-foreground leading-relaxed">&quot;{contentPreview}&quot;</p>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Graph ID</div>
              <div className="text-xs text-foreground font-mono bg-[color-mix(in_oklab,var(--color-df-base)_40%,transparent)] border border-border rounded px-2 py-1">
                {graphId || 'Not set'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Return Node ID</div>
              <div className="text-xs text-foreground font-mono bg-[color-mix(in_oklab,var(--color-df-base)_40%,transparent)] border border-border rounded px-2 py-1">
                {returnNodeId || 'Not set'}
              </div>
            </div>

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

          <Handle
            type="source"
            position={sourcePosition}
            id="next"
            className="node-handle !w-4 !h-4 !rounded-full"
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <StandardNodeContextMenuItems
          nodeId={node.id}
          isStartNode={isStartNode}
          onEdit={handleEdit}
          onSetAsStart={handleSetAsStart}
          onDelete={handleDelete}
          showDelete={canDelete}
          afterEditItems={
            graphId ? (
              <ContextMenuItem onSelect={handleOpenStorylet}>
                <ExternalLink size={14} className="mr-2" /> Open Storylet Graph
              </ContextMenuItem>
            ) : undefined
          }
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

StoryletNode.displayName = 'StoryletNode';
