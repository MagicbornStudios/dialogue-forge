import React from 'react';
import { FORGE_NODE_TYPE, type ForgeNodeType } from '../../../../../../../../types';
import { FORGE_NODE_TYPE_LABELS, AVAILABLE_STORYLET_NODE_TYPES } from '../../../../../../../../types/ui-constants';

interface PlayerEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertNode: (type: ForgeNodeType, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

// Player nodes can connect to CHARACTER or CONDITIONAL nodes
const availableNodeTypes: readonly ForgeNodeType[] = AVAILABLE_STORYLET_NODE_TYPES.PLAYER_EDGE;

export function PlayerEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertNode,
  onClose,
}: PlayerEdgeContextMenuProps) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y }}>
      <div className="bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[180px]">
        <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase border-b border-border">
          Insert Node
        </div>
        {availableNodeTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              onInsertNode(type, edgeId, graphX, graphY);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded"
          >
            Insert {FORGE_NODE_TYPE_LABELS[type]}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
