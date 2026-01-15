import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ContextMenuBase';
import { useForgeEditorActions } from '@/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeEditorActions';
import { useForgeEditorSessionStore } from '@/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeEditorSession';

interface PlayerEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  fromChoiceIdx?: number;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
}

// PLAYER nodes can connect to CHARACTER or CONDITIONAL nodes
const availableNodeTypes: ForgeNodeType[] = [FORGE_NODE_TYPE.CHARACTER, FORGE_NODE_TYPE.CONDITIONAL];

export function PlayerEdgeDropMenu({
  screenX,
  screenY,
  flowX,
  flowY,
  fromNodeId,
  fromChoiceIdx,
  sourceHandle,
  edgeId,
  onClose,
}: PlayerEdgeDropMenuProps) {
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
        fromChoiceIdx,
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
