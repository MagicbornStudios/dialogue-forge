import React from 'react';
import { NODE_TYPE } from '../../../../types/constants';
import type { NodeType } from '../../../../types/constants';

interface PlayerEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  fromChoiceIdx?: number;
  sourceHandle?: string;
  onAddNode: (
    type: NodeType,
    x: number,
    y: number,
    autoConnect?: {
      fromNodeId: string;
      fromChoiceIdx?: number;
      sourceHandle?: string;
    }
  ) => void;
  onClose: () => void;
}

const nodeTypeLabels: Record<NodeType, string> = {
  [NODE_TYPE.NPC]: 'NPC Node',
  [NODE_TYPE.PLAYER]: 'Player Node',
  [NODE_TYPE.CONDITIONAL]: 'Conditional Node',
  [NODE_TYPE.STORYLET]: 'Storylet Node',
  [NODE_TYPE.STORYLET_POOL]: 'Storylet Pool Node',
  [NODE_TYPE.RANDOMIZER]: 'Randomizer Node',
};

// Player nodes can connect to NPC or Conditional nodes
const availableNodeTypes: NodeType[] = [NODE_TYPE.NPC, NODE_TYPE.CONDITIONAL];

export function PlayerEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  fromChoiceIdx,
  sourceHandle,
  onAddNode,
  onClose,
}: PlayerEdgeDropMenuProps) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y }}>
      <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
        <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
          Create Node
        </div>
        {availableNodeTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              onAddNode(type, graphX, graphY, {
                fromNodeId,
                fromChoiceIdx,
                sourceHandle,
              });
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
          >
            Add {nodeTypeLabels[type]}
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
