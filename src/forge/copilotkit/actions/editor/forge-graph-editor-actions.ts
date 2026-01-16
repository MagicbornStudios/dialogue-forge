/**
 * Forge Graph Editor Actions
 * 
 * Editor-level CopilotKit actions that operate on the graph editor instance.
 * These actions manipulate graph structure (nodes, edges) via the editor shell.
 * 
 * Note: These actions require access to ForgeEditorActions which are provided
 * via context within the editor component tree.
 */

import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';
import type { ForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import type { ForgeNodeType, ForgeNode } from '@/forge/types/forge-graph';
import { FORGE_ACTION_NAME } from '../../constants/forge-action-names';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import type { ReactFlowInstance } from 'reactflow';

/**
 * Create createNode action
 */
export function createCreateNodeAction(
  editorActions: ForgeEditorActions,
  reactFlow: ReactFlowInstance | null
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.CREATE_NODE,
    description: 'Create a new node in the graph editor. If position is not provided, node will be placed at the center of the viewport.',
    parameters: [
      {
        name: 'nodeType',
        type: 'string',
        description: 'Type of node to create (CHARACTER, PLAYER, CONDITIONAL, etc.)',
        required: true,
      },
      {
        name: 'x',
        type: 'number',
        description: 'X position for the node (optional, defaults to viewport center)',
        required: false,
      },
      {
        name: 'y',
        type: 'number',
        description: 'Y position for the node (optional, defaults to viewport center)',
        required: false,
      },
      {
        name: 'autoFocus',
        type: 'boolean',
        description: 'Whether to focus on the node after creation',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const nodeType = args.nodeType as string;
      if (!nodeType) {
        throw new Error('nodeType is required');
      }

      // Validate node type
      const validTypes = Object.values(FORGE_NODE_TYPE);
      if (!validTypes.includes(nodeType as ForgeNodeType)) {
        throw new Error(`Invalid node type: ${nodeType}. Valid types: ${validTypes.join(', ')}`);
      }

      // Calculate position
      let x = args.x as number | undefined;
      let y = args.y as number | undefined;

      if (x === undefined || y === undefined) {
        if (reactFlow) {
          const viewport = reactFlow.getViewport();
          const center = reactFlow.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          });
          x = x ?? center.x;
          y = y ?? center.y;
        } else {
          x = x ?? 0;
          y = y ?? 0;
        }
      }

      // Create node
      editorActions.createNode(nodeType as ForgeNodeType, x, y);

      // Focus if requested
      const autoFocus = args.autoFocus as boolean | undefined;
      if (autoFocus && reactFlow) {
        // Focus will be handled by the editor after node creation
        // The node will be selected automatically
      }

      return {
        success: true,
        message: `Created ${nodeType} node at (${x}, ${y})`,
        nodeType,
        x,
        y,
      };
    },
  };
}

/**
 * Create deleteNode action
 */
export function createDeleteNodeAction(
  editorActions: ForgeEditorActions
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.DELETE_NODE,
    description: 'Delete a node from the graph',
    parameters: [
      {
        name: 'nodeId',
        type: 'string',
        description: 'The ID of the node to delete',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        throw new Error('nodeId is required');
      }

      editorActions.deleteNode(nodeId);

      return {
        success: true,
        message: `Deleted node: ${nodeId}`,
        nodeId,
      };
    },
  };
}

/**
 * Create updateNode action
 */
export function createUpdateNodeAction(
  editorActions: ForgeEditorActions
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.UPDATE_NODE,
    description: 'Update node data (content, speaker, flags, etc.)',
    parameters: [
      {
        name: 'nodeId',
        type: 'string',
        description: 'The ID of the node to update',
        required: true,
      },
      {
        name: 'updates',
        type: 'object',
        description: 'The updates to apply to the node (e.g., { content: "Hello", speaker: "NPC" })',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const nodeId = args.nodeId as string;
      const updates = args.updates as Partial<ForgeNode>;

      if (!nodeId) {
        throw new Error('nodeId is required');
      }
      if (!updates || typeof updates !== 'object') {
        throw new Error('updates must be an object');
      }

      editorActions.patchNode(nodeId, updates);

      return {
        success: true,
        message: `Updated node: ${nodeId}`,
        nodeId,
        updates,
      };
    },
  };
}

/**
 * Create createEdge action
 */
export function createCreateEdgeAction(
  editorActions: ForgeEditorActions
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.CREATE_EDGE,
    description: 'Create an edge (connection) between two nodes',
    parameters: [
      {
        name: 'sourceNodeId',
        type: 'string',
        description: 'The ID of the source node',
        required: true,
      },
      {
        name: 'targetNodeId',
        type: 'string',
        description: 'The ID of the target node',
        required: true,
      },
      {
        name: 'sourceHandle',
        type: 'string',
        description: 'Optional source handle ID (for choice edges, etc.)',
        required: false,
      },
      {
        name: 'targetHandle',
        type: 'string',
        description: 'Optional target handle ID',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const sourceNodeId = args.sourceNodeId as string;
      const targetNodeId = args.targetNodeId as string;
      const sourceHandle = args.sourceHandle as string | undefined;
      const targetHandle = args.targetHandle as string | undefined;

      if (!sourceNodeId || !targetNodeId) {
        throw new Error('sourceNodeId and targetNodeId are required');
      }

      editorActions.createEdge({
        source: sourceNodeId,
        target: targetNodeId,
        sourceHandle: sourceHandle ?? null,
        targetHandle: targetHandle ?? null,
      });

      return {
        success: true,
        message: `Created edge from ${sourceNodeId} to ${targetNodeId}`,
        sourceNodeId,
        targetNodeId,
      };
    },
  };
}

/**
 * Create deleteEdge action
 */
export function createDeleteEdgeAction(
  editorActions: ForgeEditorActions
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.DELETE_EDGE,
    description: 'Delete an edge (connection) from the graph',
    parameters: [
      {
        name: 'edgeId',
        type: 'string',
        description: 'The ID of the edge to delete',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const edgeId = args.edgeId as string;
      if (!edgeId) {
        throw new Error('edgeId is required');
      }

      editorActions.deleteEdge(edgeId);

      return {
        success: true,
        message: `Deleted edge: ${edgeId}`,
        edgeId,
      };
    },
  };
}

/**
 * Create focusNode action
 */
export function createFocusNodeAction(
  editorActions: ForgeEditorActions,
  reactFlow: ReactFlowInstance | null
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.FOCUS_NODE,
    description: 'Focus on a specific node in the graph editor (selects and centers the view on it)',
    parameters: [
      {
        name: 'nodeId',
        type: 'string',
        description: 'The ID of the node to focus on',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        throw new Error('nodeId is required');
      }

      // Select the node
      editorActions.selectNode(nodeId);

      // Center view on node if reactFlow is available
      if (reactFlow) {
        const node = reactFlow.getNode(nodeId);
        if (node) {
          reactFlow.setCenter(node.position.x + 110, node.position.y + 60, {
            zoom: 1,
            duration: 500,
          });
        }
      }

      return {
        success: true,
        message: `Focused on node: ${nodeId}`,
        nodeId,
      };
    },
  };
}

/**
 * Create createAndConnectNode action
 */
export function createCreateAndConnectNodeAction(
  editorActions: ForgeEditorActions,
  reactFlow: ReactFlowInstance | null
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.EDITOR.CREATE_AND_CONNECT_NODE,
    description: 'Create a new node and automatically connect it from a source node',
    parameters: [
      {
        name: 'nodeType',
        type: 'string',
        description: 'Type of node to create',
        required: true,
      },
      {
        name: 'sourceNodeId',
        type: 'string',
        description: 'The ID of the source node to connect from',
        required: true,
      },
      {
        name: 'x',
        type: 'number',
        description: 'X position for the new node (optional)',
        required: false,
      },
      {
        name: 'y',
        type: 'number',
        description: 'Y position for the new node (optional)',
        required: false,
      },
      {
        name: 'autoFocus',
        type: 'boolean',
        description: 'Whether to focus on the new node after creation',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const nodeType = args.nodeType as string;
      const sourceNodeId = args.sourceNodeId as string;

      if (!nodeType || !sourceNodeId) {
        throw new Error('nodeType and sourceNodeId are required');
      }

      // Validate node type
      const validTypes = Object.values(FORGE_NODE_TYPE);
      if (!validTypes.includes(nodeType as ForgeNodeType)) {
        throw new Error(`Invalid node type: ${nodeType}`);
      }

      // Calculate position
      let x = args.x as number | undefined;
      let y = args.y as number | undefined;

      if (x === undefined || y === undefined) {
        if (reactFlow) {
          const sourceNode = reactFlow.getNode(sourceNodeId);
          if (sourceNode) {
            // Place new node to the right/below source node
            x = x ?? sourceNode.position.x + 300;
            y = y ?? sourceNode.position.y;
          } else {
            const viewport = reactFlow.getViewport();
            const center = reactFlow.screenToFlowPosition({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            });
            x = x ?? center.x;
            y = y ?? center.y;
          }
        } else {
          x = x ?? 0;
          y = y ?? 0;
        }
      }

      // Create node with auto-connect
      editorActions.createNode(nodeType as ForgeNodeType, x, y, {
        fromNodeId: sourceNodeId,
      });

      const autoFocus = args.autoFocus as boolean | undefined;
      if (autoFocus && reactFlow) {
        // Node will be selected automatically
      }

      return {
        success: true,
        message: `Created and connected ${nodeType} node from ${sourceNodeId}`,
        nodeType,
        sourceNodeId,
        x,
        y,
      };
    },
  };
}

/**
 * Create all editor actions
 * 
 * Note: These actions require ForgeEditorActions from context and ReactFlow instance.
 * They should be registered within the editor component tree where these are available.
 */
export function createForgeGraphEditorActions(
  editorActions: ForgeEditorActions,
  reactFlow: ReactFlowInstance | null
): FrontendAction<Parameter[]>[] {
  return [
    createCreateNodeAction(editorActions, reactFlow),
    createDeleteNodeAction(editorActions),
    createUpdateNodeAction(editorActions),
    createCreateEdgeAction(editorActions),
    createDeleteEdgeAction(editorActions),
    createFocusNodeAction(editorActions, reactFlow),
    createCreateAndConnectNodeAction(editorActions, reactFlow),
  ];
}
