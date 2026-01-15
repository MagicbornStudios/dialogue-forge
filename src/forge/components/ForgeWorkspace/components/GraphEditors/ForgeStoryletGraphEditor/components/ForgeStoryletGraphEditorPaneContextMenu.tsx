import React from 'react';
import { ForgeNodeType } from '@/src/types/forge/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';

interface ForgeStoryletGraphEditorPaneContextMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  onAddNode: (type: ForgeNodeType, x: number, y: number) => void;
  onClose: () => void;
}

// Available node types from pane context menu
const availableNodeTypes: ForgeNodeType[] = ['CHARACTER', 'PLAYER', 'CONDITIONAL'];

export function ForgeStoryletGraphEditorPaneContextMenu({
  x,
  y,
  graphX,
  graphY,
  onAddNode,
  onClose,
}: ForgeStoryletGraphEditorPaneContextMenuProps) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y }}>
      <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
        {availableNodeTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              onAddNode(type, graphX, graphY);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
          >
            Add {FORGE_NODE_TYPE_LABELS[type]}
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
