import React from 'react';
import { ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@magicborn/forge/types/ui-constants';

interface CharacterEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertNode: (type: ForgeNodeType, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

// NPC nodes can connect to Player or Conditional nodes
const availableNodeTypes: ForgeNodeType[] = ['PLAYER', 'CONDITIONAL'];

export function CharacterEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertNode,
  onClose,
}: CharacterEdgeContextMenuProps) {
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
