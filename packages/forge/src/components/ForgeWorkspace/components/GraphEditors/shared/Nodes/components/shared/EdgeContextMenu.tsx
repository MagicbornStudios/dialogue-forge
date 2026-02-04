import React from 'react';
import type { ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS, EDGE_MENU_NODE_TYPES } from '@magicborn/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ContextMenuBase';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  sourceNodeType: ForgeNodeType;
  onInsertNode: (type: ForgeNodeType, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

/**
 * Generic edge context menu component
 * 
 * Consolidates the duplicate PlayerEdgeContextMenu, CharacterEdgeContextMenu,
 * and ConditionalEdgeContextMenu components. Only difference between them
 * was the available node types array.
 */
export function EdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  sourceNodeType,
  onInsertNode,
  onClose,
}: EdgeContextMenuProps) {
  // Get available node types for the source node type
  const availableNodeTypes = EDGE_MENU_NODE_TYPES[sourceNodeType as keyof typeof EDGE_MENU_NODE_TYPES] || [];

  return (
    <ContextMenuBase x={x} y={y} title="Insert Node" onClose={onClose}>
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