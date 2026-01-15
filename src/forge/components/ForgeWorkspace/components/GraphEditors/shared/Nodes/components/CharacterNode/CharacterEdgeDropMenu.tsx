import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ContextMenuBase';
import { useForgeEditorActions } from '@/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeEditorActions';
import { useForgeEditorSessionStore } from '@/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeEditorSession';

interface CharacterEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
}

// CHARACTER nodes can connect to PLAYER or CONDITIONAL nodes
const availableNodeTypes: ForgeNodeType[] = [FORGE_NODE_TYPE.PLAYER, FORGE_NODE_TYPE.CONDITIONAL];

export function CharacterEdgeDropMenu({
  screenX,
  screenY,
  flowX,
  flowY,
  fromNodeId,
  sourceHandle,
  edgeId,
  onClose,
}: CharacterEdgeDropMenuProps) {
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
