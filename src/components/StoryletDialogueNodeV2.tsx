import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BookmarkPlus, Tags, Share2 } from 'lucide-react';
import { DialogueNode } from '../types';
import { LayoutDirection } from '../utils/layout';
import { NODE_TYPE } from '../types/constants';

interface StoryletNodeData {
  node: DialogueNode;
  layoutDirection?: LayoutDirection;
  isStartNode?: boolean;
  isInPath?: boolean;
  isDimmed?: boolean;
}

export function StoryletDialogueNodeV2({ data, selected }: NodeProps<StoryletNodeData>) {
  const {
    node,
    layoutDirection = 'TB',
    isStartNode,
    isInPath,
    isDimmed,
  } = data;

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const tags = node.tags?.length ? node.tags.join(', ') : 'No tags';

  return (
    <div
      className={`rounded-lg border-2 bg-df-surface text-df-text shadow-sm transition-all ${
        selected ? 'border-df-node-selected shadow-lg shadow-df-glow' : 'border-df-border'
      } ${isDimmed ? 'opacity-40 saturate-50' : ''} min-w-[260px] max-w-[380px]`}
    >
      <Handle
        type="target"
        position={targetPosition}
        id="target"
        className="!bg-df-control-bg !border-df-control-border !w-3.5 !h-3.5 !rounded-full"
      />

      <div className="flex items-center gap-2 border-b border-df-border bg-df-muted px-3 py-2">
        <BookmarkPlus size={18} className="text-df-primary" />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Storylet Node</span>
          <span className="text-xs text-df-muted-foreground">{node.storyletId || 'Unlinked storylet'}</span>
        </div>
        {isStartNode && (
          <span className="ml-auto rounded-full bg-df-start-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-df-text">
            Start
          </span>
        )}
      </div>

      <div className="px-3 py-2 space-y-2">
        <div className="text-xs text-df-muted-foreground">{node.content || 'Storylet entry point'}</div>
        <div className="flex items-center gap-2 text-xs text-df-muted-foreground">
          <Tags size={14} />
          <span className="truncate">{tags}</span>
        </div>
        {node.weight !== undefined && (
          <div className="flex items-center gap-2 text-xs text-df-muted-foreground">
            <Share2 size={14} />
            <span>Weight: {node.weight}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={sourcePosition}
        id="next"
        className="!bg-df-control-bg !border-df-control-border !w-3.5 !h-3.5 !rounded-full"
      />
    </div>
  );
}

StoryletDialogueNodeV2.displayName = 'StoryletDialogueNodeV2';

export const STORYLET_NODE_TYPE = NODE_TYPE.STORYLET;
