import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Hash, BookOpen, Flag, Play, Edit3, Trash2, ExternalLink } from 'lucide-react';
import type { FlagSchema } from '../../../../../types/flags';
import type { LayoutDirection } from '../../../utils/layout/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../../ui/context-menu';

import type { ForgeNode } from '@/src/types/forge/forge-graph';
import { getFlagColorClass } from '../../../utils/flag-styles';
import { useForgeEditorActions } from '../../../hooks/useForgeEditorActions';

interface StoryletNodeData {
  node: ForgeNode;
  flagSchema?: FlagSchema;
  ui?: {
    isDimmed?: boolean;
    isInPath?: boolean;
    isStartNode?: boolean;
    isEndNode?: boolean;
  };
  layoutDirection?: LayoutDirection;
}

export function StoryletNode({ data, selected }: NodeProps<StoryletNodeData>) {
  const { node, flagSchema, ui = {}, layoutDirection = 'TB' } = data;
  const { isDimmed, isInPath, isStartNode, isEndNode } = ui;

  const actions = useForgeEditorActions();

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const borderClass = selected
    ? 'border-df-npc-selected shadow-lg shadow-df-glow'
    : isStartNode
      ? 'border-df-start shadow-md'
      : isEndNode
        ? 'border-df-end shadow-md'
        : 'border-df-npc-border';

  const headerBgClass = isStartNode ? 'bg-df-start-bg' : isEndNode ? 'bg-df-end-bg' : 'bg-df-npc-header';

  const contentPreview =
    node.content?.length && node.content.length > 60 ? `${node.content.slice(0, 60)}...` : node.content || 'No description yet.';

  const graphId = node.storyletCall?.targetGraphId;
  const returnNodeId = node.storyletCall?.returnNodeId;

  const canDelete = !!node.id && !isStartNode;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onContextMenu={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (node.id) actions.openNodeEditor(node.id);
          }}
          className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${
            isInPath ? 'border-df-node-selected/70' : ''
          } bg-df-npc-bg min-w-[320px] max-w-[450px] relative overflow-hidden`}
          style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
        >
          <Handle
            type="target"
            position={targetPosition}
            className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
          />

          <div className={`${headerBgClass} border-b-2 border-df-npc-border px-3 py-2.5 flex items-center gap-3 relative`}>
            <div className="w-14 h-14 rounded-full bg-df-npc-bg border-[3px] border-df-npc-border flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
              <BookOpen size={20} className="text-df-npc-selected" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-df-text-primary truncate leading-tight">Storylet</h3>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded bg-df-base/50 border border-df-control-border"
                title={`Node ID: ${node.id}`}
              >
                <Hash size={12} className="text-df-text-secondary" />
                <span className="text-[10px] font-mono text-df-text-secondary">{node.id}</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-npc-selected/20 border border-df-npc-selected/50" title="Storylet Node">
                <BookOpen size={14} className="text-df-npc-selected" />
                <span className="text-[10px] font-semibold text-df-npc-selected">STORYLET</span>
              </div>
            </div>

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

          <div className="px-4 py-3 space-y-2">
            <div className="bg-df-elevated border border-df-control-border rounded-lg px-4 py-3">
              <p className="text-sm text-df-text-primary leading-relaxed">&quot;{contentPreview}&quot;</p>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-df-text-secondary uppercase">Graph ID</div>
              <div className="text-xs text-df-text-primary font-mono bg-df-base/40 border border-df-control-border rounded px-2 py-1">
                {graphId || 'Not set'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-df-text-secondary uppercase">Return Node ID</div>
              <div className="text-xs text-df-text-primary font-mono bg-df-base/40 border border-df-control-border rounded px-2 py-1">
                {returnNodeId || 'Not set'}
              </div>
            </div>

            {node.setFlags && node.setFlags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {node.setFlags.map((flagId: string) => {
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
            className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full hover:!border-df-npc-selected hover:!bg-df-npc-selected/20"
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onSelect={() => node.id && actions.openNodeEditor(node.id)}>
          <Edit3 size={14} className="mr-2 text-df-npc-selected" /> Edit Node
        </ContextMenuItem>

        {graphId && (
          <ContextMenuItem onSelect={() => actions.openGraph({ graphId, reason: 'storyletNode' })}>
            <ExternalLink size={14} className="mr-2" /> Open Storylet Graph
          </ContextMenuItem>
        )}

        {canDelete && (
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
