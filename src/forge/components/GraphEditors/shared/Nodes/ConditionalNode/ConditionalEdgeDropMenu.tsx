import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@/forge/components/GraphEditors/shared/ContextMenuBase';
import { useForgeEditorActions } from '@/forge/components/GraphEditors/hooks/useForgeEditorActions';
import { useForgeEditorSessionStore } from '@/forge/components/GraphEditors/hooks/useForgeEditorSession';

interface ConditionalEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  fromBlockIdx?: number;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
}

// Conditional nodes can connect to CHARACTER or PLAYER nodes
const availableNodeTypes: ForgeNodeType[] = [FORGE_NODE_TYPE.CHARACTER, FORGE_NODE_TYPE.PLAYER];

export function ConditionalEdgeDropMenu({
  screenX,
  screenY,
  flowX,
  flowY,
  fromNodeId,
  fromBlockIdx,
  sourceHandle,
  edgeId,
  onClose,
}: ConditionalEdgeDropMenuProps) {
  const actions = useForgeEditorActions();
  const sessionStore = useForgeEditorSessionStore();

  const handleAddNode = (type: ForgeNodeType) => {
    if (edgeId) {
      // Insert node on existing edge
      actions.insertNodeOnEdge(edgeId, type, flowX, flowY);
    } else {
      // Create new node with auto-connect
      actions.createNode(type, flowX, flowY, {
        fromNodeId,
        sourceHandle,
        fromBlockIdx,
      });
    }
    onClose();
  };

  return (
    <ContextMenuBase x={screenX} y={screenY} title="Create Node">
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
