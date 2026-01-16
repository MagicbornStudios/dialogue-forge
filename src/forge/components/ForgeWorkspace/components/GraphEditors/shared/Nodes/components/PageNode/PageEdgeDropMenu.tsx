import React from 'react';
import { ForgeNodeType, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '../../shared/ContextMenuBase';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { useForgeEditorSessionStore } from '@/forge/lib/graph-editor/hooks/useForgeEditorSession';

// PAGE nodes can create PAGE, CHAPTER, or ACT nodes
const availableNodeTypes: ForgeNodeType[] = [
  FORGE_NODE_TYPE.PAGE,
  FORGE_NODE_TYPE.CHAPTER,
  FORGE_NODE_TYPE.ACT,
];

interface PageEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  edgeId?: string;
  onClose: () => void;
}

export function PageEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  edgeId,
  onClose,
}: PageEdgeDropMenuProps) {
  const actions = useForgeEditorActions();

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
