import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ContextMenuBase';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { useForgeEditorSessionStore } from '@/forge/lib/graph-editor/hooks/useForgeEditorSession';

// ACT nodes can connect to CHAPTER nodes
const availableNodeTypes: ForgeNodeType[] = [FORGE_NODE_TYPE.CHAPTER];

interface ActEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  edgeId?: string;
  onClose: () => void;
}

export function ActEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  edgeId,
  onClose,
}: ActEdgeDropMenuProps) {
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
    <ContextMenuBase x={x} y={y} title="Create Node" onClose={onClose}>
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
