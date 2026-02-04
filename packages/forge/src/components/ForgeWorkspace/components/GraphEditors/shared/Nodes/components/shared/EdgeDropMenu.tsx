import React from 'react';
import type { ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS, EDGE_DROP_MENU_NODE_TYPES } from '@magicborn/forge/types/ui-constants';
import { ContextMenuBase, ContextMenuButton } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ContextMenuBase';
import { useForgeEditorActions } from '@magicborn/forge/lib/graph-editor/hooks/useForgeEditorActions';

interface BaseEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
  sourceNodeType: ForgeNodeType; // Added to get available node types
}

interface PlayerEdgeDropMenuProps extends BaseEdgeDropMenuProps {
  fromChoiceIdx?: number;
}

interface ConditionalEdgeDropMenuProps extends BaseEdgeDropMenuProps {
  fromBlockIdx?: number;
}

type EdgeDropMenuProps = BaseEdgeDropMenuProps | PlayerEdgeDropMenuProps | ConditionalEdgeDropMenuProps;

/**
 * Generic edge drop menu component
 * 
 * Consolidates the duplicate PlayerEdgeDropMenu, CharacterEdgeDropMenu,
 * and ConditionalEdgeDropMenu components. Only differences are:
 * - Available node types array (determined by sourceNodeType)
 * - Optional specific parameters (fromChoiceIdx, fromBlockIdx)
 */
export function EdgeDropMenu(props: EdgeDropMenuProps) {
  const {
    screenX,
    screenY,
    flowX,
    flowY,
    fromNodeId,
    sourceHandle,
    edgeId,
    onClose,
    sourceNodeType,
  } = props;

  const actions = useForgeEditorActions();

  // Get available node types for the source node type
  const availableNodeTypes = EDGE_DROP_MENU_NODE_TYPES[sourceNodeType as keyof typeof EDGE_DROP_MENU_NODE_TYPES] || [];

  const handleAddNode = (type: ForgeNodeType) => {
    if (edgeId) {
      // Insert node on existing edge
      actions.insertNodeOnEdge(edgeId, type, flowX, flowY);
    } else {
      // Create new node with auto-connect - handle type-specific parameters
      const createParams: any = {
        fromNodeId,
        sourceHandle,
      };

      // Add type-specific parameters if they exist
      if ('fromChoiceIdx' in props && props.fromChoiceIdx !== undefined) {
        createParams.fromChoiceIdx = props.fromChoiceIdx;
      }
      if ('fromBlockIdx' in props && props.fromBlockIdx !== undefined) {
        createParams.fromBlockIdx = props.fromBlockIdx;
      }

      actions.createNode(type, flowX, flowY, createParams);
    }
    onClose();
  };

  return (
    <ContextMenuBase x={screenX} y={screenY} title="Create Node" onClose={onClose}>
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