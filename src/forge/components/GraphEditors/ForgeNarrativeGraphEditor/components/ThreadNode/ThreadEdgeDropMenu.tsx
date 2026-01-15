import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@/forge/components/GraphEditors/shared/Nodes/components/ContextMenuBase';
import { useForgeEditorActions } from '@/forge/components/GraphEditors/hooks/useForgeEditorActions';
import { useForgeEditorSessionStore } from '@/forge/components/GraphEditors/hooks/useForgeEditorSession';

// START node can connect to ACT nodes
const availableNodeTypes: ForgeNodeType[] = [FORGE_NODE_TYPE.ACT];

interface ThreadEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  edgeId?: string;
  onClose: () => void;
}

export function ThreadEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  edgeId,
  onClose,
}: ThreadEdgeDropMenuProps) {
  const actions = useForgeEditorActions();
  const sessionStore = useForgeEditorSessionStore();

  const handleAddNode = (type: ForgeNodeType) => {
    if (edgeId) {
      // Insert node on existing edge
      actions.insertNodeOnEdge(edgeId, type, graphX, graphY);
    } else {
      // Create new node with auto-connect
      actions.createNode(type, graphX, graphY, {
        fromNodeId,
      });
    }
    onClose();
  };

  return (
    <ContextMenuBase x={x} y={y} title="Create Node">
      {availableNodeTypes.map(type => (
        <ContextMenuButton
          key={type}
          onClick={() => handleAddNode(type)}
        >
          Add {FORGE_NODE_TYPE_LABELS[type]}
        </ContextMenuButton>
      ))}
      <ContextMenuButton onClick={onClose} variant="secondary">
        Cancel
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
