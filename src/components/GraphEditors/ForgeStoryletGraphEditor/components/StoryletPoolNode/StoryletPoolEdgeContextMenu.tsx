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

// Storylet Pool nodes can connect to Player or Conditional nodes (same as NPC)
const availableNodeTypes: NodeType[] = [NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL];

interface StoryletPoolEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertNode: (type: NodeType, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

export function StoryletPoolEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertNode,
  onClose,
}: StoryletPoolEdgeContextMenuProps) {
  return (
    <ContextMenuBase x={x} y={y} title="Insert Node">
      {availableNodeTypes.map(type => (
        <ContextMenuButton
          key={type}
          onClick={() => {
            onInsertNode(type, edgeId, graphX, graphY);
            onClose();
          }}
        >
          Insert {nodeTypeLabels[type]}
        </ContextMenuButton>
      ))}
      <ContextMenuButton onClick={onClose} variant="secondary">
        Cancel
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
