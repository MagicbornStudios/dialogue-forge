import React from 'react';
import { NODE_TYPE } from '../../../../types/constants';
import type { NodeType } from '../../../../types/constants';
import { ContextMenuBase, ContextMenuButton } from '../../shared/ContextMenuBase';

const nodeTypeLabels: Record<NodeType, string> = {
  [NODE_TYPE.NPC]: 'NPC Node',
  [NODE_TYPE.PLAYER]: 'Player Node',
  [NODE_TYPE.CONDITIONAL]: 'Conditional Node',
  [NODE_TYPE.STORYLET]: 'Storylet Node',
  [NODE_TYPE.STORYLET_POOL]: 'Storylet Pool Node',
  [NODE_TYPE.RANDOMIZER]: 'Randomizer Node',
  [NODE_TYPE.DETOUR]: 'Detour Node',
};

// Storylet nodes can connect to Player or Conditional nodes (same as NPC)
const availableNodeTypes: NodeType[] = [NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL];

interface StoryletEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  sourceHandle?: string;
  onAddNode: (
    type: NodeType,
    x: number,
    y: number,
    autoConnect?: {
      fromNodeId: string;
      sourceHandle?: string;
    }
  ) => void;
  onClose: () => void;
}

export function StoryletEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  sourceHandle,
  onAddNode,
  onClose,
}: StoryletEdgeDropMenuProps) {
  return (
    <ContextMenuBase x={x} y={y} title="Create Node">
      {availableNodeTypes.map(type => (
        <ContextMenuButton
          key={type}
          onClick={() => {
            onAddNode(type, graphX, graphY, {
              fromNodeId,
              sourceHandle,
            });
            onClose();
          }}
        >
          Add {nodeTypeLabels[type]}
        </ContextMenuButton>
      ))}
      <ContextMenuButton onClick={onClose} variant="secondary">
        Cancel
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
