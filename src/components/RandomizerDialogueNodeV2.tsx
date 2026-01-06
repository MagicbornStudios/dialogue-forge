import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Dice5, Shuffle } from 'lucide-react';
import { DialogueNode } from '../types';
import { LayoutDirection } from '../utils/layout';
import { CHOICE_COLORS } from '../utils/reactflow-converter';
import { NODE_TYPE } from '../types/constants';

interface RandomizerNodeData {
  node: DialogueNode;
  layoutDirection?: LayoutDirection;
  isInPath?: boolean;
  isDimmed?: boolean;
}

export function RandomizerDialogueNodeV2({ data, selected }: NodeProps<RandomizerNodeData>) {
  const { node, layoutDirection = 'TB', isInPath, isDimmed } = data;
  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const options = node.randomizerOptions ?? [];

  return (
    <div
      className={`rounded-lg border-2 bg-df-surface text-df-text shadow-sm transition-all ${
        selected ? 'border-df-node-selected shadow-lg shadow-df-glow' : 'border-df-border'
      } ${isDimmed ? 'opacity-40 saturate-50' : ''} min-w-[280px] max-w-[400px]`}
    >
      <Handle
        type="target"
        position={targetPosition}
        id="target"
        className="!bg-df-control-bg !border-df-control-border !w-3.5 !h-3.5 !rounded-full"
      />

      <div className="flex items-center gap-2 border-b border-df-border bg-df-muted px-3 py-2">
        <Dice5 size={18} className="text-df-primary" />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Randomizer</span>
          <span className="text-xs text-df-muted-foreground">{node.content || 'Randomly choose an outcome'}</span>
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        {options.length === 0 && (
          <div className="text-xs text-df-muted-foreground">Add outcomes to route to new beats.</div>
        )}
        {options.map((option, idx) => {
          const color = CHOICE_COLORS[idx % CHOICE_COLORS.length];
          return (
            <div key={option.id} className="flex items-center gap-2 rounded border border-df-border/60 bg-df-muted px-2 py-1 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
                title={option.label}
              />
              <div className="flex-1 truncate">
                <span className="font-semibold">{option.label}</span>
                {option.weight !== undefined && <span className="ml-2 text-[11px] text-df-muted-foreground">w: {option.weight}</span>}
              </div>
              <span className="text-[11px] text-df-muted-foreground">{option.nextNodeId || 'Unlinked'}</span>
              <Handle
                type="source"
                position={sourcePosition}
                id={`outcome-${idx}`}
                className="!bg-df-control-bg !border-df-control-border !w-3 !h-3 !rounded-full"
              />
            </div>
          );
        })}
      </div>

      {isInPath && <div className="bg-df-node-selected/10 px-3 py-2 text-[11px] text-df-muted-foreground">Path active</div>}
    </div>
  );
}

RandomizerDialogueNodeV2.displayName = 'RandomizerDialogueNodeV2';

export const RANDOMIZER_NODE_TYPE = NODE_TYPE.RANDOMIZER;
