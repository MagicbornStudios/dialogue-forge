import React from 'react';
import { FORGE_NODE_TYPE, type ForgeNodeType } from '../../../../types/forge/forge-graph';
import { FORGE_NODE_TYPE_LABELS, AVAILABLE_STORYLET_NODE_TYPES } from '../../../../types/ui-constants';

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
const availableNodeTypes: ForgeNodeType[] = AVAILABLE_STORYLET_NODE_TYPES.PLAYER_EDGE;

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
      <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[180px]">
        <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
          Insert Node
        </div>
        {availableNodeTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              onInsertNode(type, edgeId, graphX, graphY);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
          >
            Insert {FORGE_NODE_TYPE_LABELS[type]}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
