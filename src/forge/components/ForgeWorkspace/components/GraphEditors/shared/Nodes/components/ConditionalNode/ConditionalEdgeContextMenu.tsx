import React from 'react';
import { FORGE_NODE_TYPE, type ForgeNodeType } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';

interface ConditionalEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertNode: (type: ForgeNodeType, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

// Conditional nodes can connect to NPC or Player nodes
const availableNodeTypes: ForgeNodeType[] = [FORGE_NODE_TYPE.CHARACTER, FORGE_NODE_TYPE.PLAYER];

export function ConditionalEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertNode,
  onClose,
}: ConditionalEdgeContextMenuProps) {
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
