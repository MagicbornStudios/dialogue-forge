import React from 'react';
import { ForgeNodeType } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@/forge/components/GraphEditors/shared/ContextMenuBase';

// Storylet nodes can connect to Player or Conditional nodes (same as NPC)
const availableNodeTypes: ForgeNodeType[] = ['PLAYER', 'CONDITIONAL'];

interface StoryletEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertNode: (type: ForgeNodeType, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

export function StoryletEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertNode,
  onClose,
}: StoryletEdgeContextMenuProps) {
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
          Insert {FORGE_NODE_TYPE_LABELS[type]}
        </ContextMenuButton>
      ))}
      <ContextMenuButton onClick={onClose} variant="secondary">
        Cancel
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
