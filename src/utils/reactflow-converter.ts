/**
 * React Flow Converter Utilities
 * 
 * Converts between DialogueTree format and React Flow format.
 * 
 * React Flow Format:
 * - nodes: Array of { id, type, position: {x, y}, data }
 * - edges: Array of { id, source, target, sourceHandle?, targetHandle?, type, data? }
 */

import { DialogueTree, DialogueNode } from '../types';
import { NODE_TYPE } from '../types/constants';
import { Node, Edge, Position } from 'reactflow';
import { LayoutDirection } from './layout';

// Color scheme for choice edges (same as current implementation)
export const CHOICE_COLORS = ['#e94560', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

export interface ReactFlowNodeData {
  node: DialogueNode;
  flagSchema?: any;
  layoutDirection?: LayoutDirection;
}

export type ReactFlowNode = Node<ReactFlowNodeData>;
export type ReactFlowEdge = Edge;

/**
 * Get handle positions based on layout direction
 * For horizontal (LR): source on right, target on left
 * For vertical (TB): source on bottom, target on top
 */
export function getHandlePositions(direction: LayoutDirection): {
  sourcePosition: Position;
  targetPosition: Position;
} {
  if (direction === 'LR') {
    return { sourcePosition: Position.Right, targetPosition: Position.Left };
  }
  return { sourcePosition: Position.Bottom, targetPosition: Position.Top };
}

/**
 * Convert DialogueTree to React Flow format
 */
export function convertDialogueTreeToReactFlow(
  dialogue: DialogueTree,
  layoutDirection: LayoutDirection = 'TB'
): {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
} {
  const nodes: ReactFlowNode[] = [];
  const edges: ReactFlowEdge[] = [];
  
  const { sourcePosition, targetPosition } = getHandlePositions(layoutDirection);

  // Convert nodes - create new node objects to avoid sharing references
  Object.values(dialogue.nodes).forEach(node => {
    // Deep copy node to avoid sharing references, especially for arrays
    const nodeCopy: DialogueNode = {
      ...node,
      choices: node.choices ? node.choices.map(choice => ({ ...choice })) : undefined,
      setFlags: node.setFlags ? [...node.setFlags] : undefined,
      conditionalBlocks: node.conditionalBlocks ? node.conditionalBlocks.map(block => ({
        ...block,
        condition: block.condition ? [...block.condition] : undefined,
      })) : undefined,
    };
    
    nodes.push({
      id: node.id,
      type: node.type,
      position: { x: node.x, y: node.y },
      data: { 
        node: nodeCopy,
        layoutDirection,
      },
      sourcePosition,
      targetPosition,
      selected: false,
    });
  });

  // Convert edges - using smoothstep type for cleaner angular look
  Object.values(dialogue.nodes).forEach(node => {
    if (node.type === NODE_TYPE.NPC && node.nextNodeId) {
      // NPC -> next node (single connection)
      edges.push({
        id: `${node.id}-next`,
        source: node.id,
        target: node.nextNodeId,
        sourceHandle: 'next',
        type: 'npc', // Uses NPCEdgeV2 component (smoothstep style)
      } as Edge);
    }

    if (node.type === NODE_TYPE.PLAYER && node.choices) {
      // Player -> multiple choices (one edge per choice)
      node.choices.forEach((choice, idx) => {
        if (choice.nextNodeId) {
          const color = CHOICE_COLORS[idx % CHOICE_COLORS.length];
          edges.push({
            id: `${node.id}-choice-${idx}`,
            source: node.id,
            target: choice.nextNodeId,
            sourceHandle: `choice-${idx}`, // Connect to specific choice handle
            type: 'choice', // Use custom ChoiceEdge (smoothstep style)
            data: {
              choiceIndex: idx,
              choiceId: choice.id,
            },
            style: {
              stroke: color,
              strokeWidth: 2,
              opacity: 0.7,
            },
          } as Edge);
        }
      });
    }

    if (node.type === NODE_TYPE.CONDITIONAL && node.conditionalBlocks) {
      // Conditional -> multiple blocks (one edge per block)
      node.conditionalBlocks.forEach((block, idx) => {
        // Each block can have its own nextNodeId (though typically only one path is taken)
        // For now, we'll treat it like choices - each block can connect to a node
        if (block.nextNodeId) {
          const color = CHOICE_COLORS[idx % CHOICE_COLORS.length];
          edges.push({
            id: `${node.id}-block-${idx}`,
            source: node.id,
            target: block.nextNodeId,
            sourceHandle: `block-${idx}`, // Connect to specific block handle
            type: 'choice', // Use same edge type as choices (smoothstep style)
            data: {
              choiceIndex: idx,
              blockId: block.id,
            },
            style: {
              stroke: color,
              strokeWidth: 2,
              opacity: 0.7,
            },
          } as Edge);
        }
      });
    }
  });

  return { nodes, edges };
}

/**
 * Convert React Flow format back to DialogueTree
 * 
 * This updates node positions and edge connections in the DialogueTree.
 */
export function updateDialogueTreeFromReactFlow(
  dialogue: DialogueTree,
  nodes: Node[],
  edges: Edge[]
): DialogueTree {
  // Create a deep copy of all nodes to avoid mutations
  const updatedNodes: Record<string, DialogueNode> = {};
  
  // First, create copies of all nodes with cleared connections
  Object.values(dialogue.nodes).forEach(node => {
    if (node.type === NODE_TYPE.NPC) {
      updatedNodes[node.id] = {
        ...node,
        nextNodeId: undefined,
      };
    } else if (node.type === NODE_TYPE.PLAYER) {
      updatedNodes[node.id] = {
        ...node,
        choices: node.choices ? node.choices.map(choice => ({
          ...choice,
          nextNodeId: '',
        })) : [],
      };
    } else if (node.type === NODE_TYPE.CONDITIONAL) {
      updatedNodes[node.id] = {
        ...node,
        conditionalBlocks: node.conditionalBlocks ? node.conditionalBlocks.map(block => ({
          ...block,
          nextNodeId: undefined,
        })) : [],
      };
    } else {
      updatedNodes[node.id] = { ...node };
    }
  });

  // Update node positions
  nodes.forEach(rfNode => {
    if (updatedNodes[rfNode.id]) {
      updatedNodes[rfNode.id] = {
        ...updatedNodes[rfNode.id],
        x: rfNode.position.x,
        y: rfNode.position.y,
      };
    }
  });

  // Apply edge connections
  edges.forEach(edge => {
    const sourceNode = updatedNodes[edge.source];
    if (!sourceNode) return;

    if (edge.sourceHandle === 'next' && sourceNode.type === NODE_TYPE.NPC) {
      // NPC next connection - create new node object
      updatedNodes[edge.source] = {
        ...sourceNode,
        nextNodeId: edge.target,
      };
    } else if (edge.sourceHandle?.startsWith('choice-') && sourceNode.type === NODE_TYPE.PLAYER) {
      // Player choice connection - create new node and choice objects
      const choiceIdx = parseInt(edge.sourceHandle.replace('choice-', ''));
      if (sourceNode.choices && sourceNode.choices[choiceIdx]) {
        const updatedChoices = [...sourceNode.choices];
        updatedChoices[choiceIdx] = {
          ...updatedChoices[choiceIdx],
          nextNodeId: edge.target,
        };
        updatedNodes[edge.source] = {
          ...sourceNode,
          choices: updatedChoices,
        };
      }
    } else if (edge.sourceHandle?.startsWith('block-') && sourceNode.type === NODE_TYPE.CONDITIONAL) {
      // Conditional block connection
      const blockIdx = parseInt(edge.sourceHandle.replace('block-', ''));
      if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
        const updatedBlocks = [...sourceNode.conditionalBlocks];
        updatedBlocks[blockIdx] = {
          ...updatedBlocks[blockIdx],
          nextNodeId: edge.target,
        };
        updatedNodes[edge.source] = {
          ...sourceNode,
          conditionalBlocks: updatedBlocks,
        };
      }
    }
  });

  return {
    ...dialogue,
    nodes: updatedNodes,
  };
}

