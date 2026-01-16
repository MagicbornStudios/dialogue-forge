import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
} from '@/shared/ui/context-menu';

interface NarrativeGraphEditorPaneContextMenuProps {
  x: number; // screenX
  y: number; // screenY
  graphX: number; // flowX
  graphY: number; // flowY
  onAddNode: (type: ForgeNodeType, x: number, y: number) => void;
  onClose: () => void;
}

// Available node types for pane context menu in narrative editor
const availableNodeTypes: ForgeNodeType[] = [
  FORGE_NODE_TYPE.ACT,
  FORGE_NODE_TYPE.CHAPTER,
  FORGE_NODE_TYPE.PAGE,
];

export function NarrativeGraphEditorPaneContextMenu({
  x,
  y,
  graphX,
  graphY,
  onAddNode,
  onClose,
}: NarrativeGraphEditorPaneContextMenuProps) {
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
