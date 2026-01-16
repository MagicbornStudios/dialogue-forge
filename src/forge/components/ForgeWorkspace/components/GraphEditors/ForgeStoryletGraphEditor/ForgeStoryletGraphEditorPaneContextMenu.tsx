import React from 'react';
import { FORGE_NODE_TYPE, type ForgeNodeType } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
} from '@/shared/ui/context-menu';

interface ForgeStoryletGraphEditorPaneContextMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  onAddNode: (type: ForgeNodeType, x: number, y: number) => void;
  onClose: () => void;
}

// Available node types from pane context menu
const availableNodeTypes: ForgeNodeType[] = [
  FORGE_NODE_TYPE.CHARACTER,
  FORGE_NODE_TYPE.PLAYER,
  FORGE_NODE_TYPE.CONDITIONAL,
];

export function ForgeStoryletGraphEditorPaneContextMenu({
  x,
  y,
  graphX,
  graphY,
  onAddNode,
  onClose,
}: ForgeStoryletGraphEditorPaneContextMenuProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuContent
        className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]"
        style={{ position: 'fixed', left: x, top: y, zIndex: 50 }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {availableNodeTypes.map(type => (
          <ContextMenuItem
            key={type}
            onSelect={() => {
              onAddNode(type, graphX, graphY);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
          >
            Add {FORGE_NODE_TYPE_LABELS[type]}
          </ContextMenuItem>
        ))}
        <ContextMenuItem
          onSelect={onClose}
          className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded"
        >
          Cancel
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
