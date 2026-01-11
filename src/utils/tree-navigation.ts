/**
 * Tree Navigation Utilities
 * 
 * Provides read-only query utilities for navigating DialogueTree structures
 * using d3-hierarchy. All mutations happen in Zustand/React Flow, this is
 * only for querying and verification.
 */

import { hierarchy, HierarchyNode } from 'd3-hierarchy';
import { ForgeGraph, ForgeNode } from '../types';
import { NODE_TYPE } from '../types/constants';

/**
 * Internal tree node structure for d3-hierarchy
 */
interface TreeNodeData {
  nodeId: string;
  node: ForgeNode;
  children?: TreeNodeData[];
}

/**
 * Get all child node IDs for a given node
 */
function getChildNodeIds(node: ForgeNode): string[] {
  const childIds: string[] = [];

  // NPC, STORYLET, STORYLET_POOL: single nextNodeId
  if (
    (node.type === NODE_TYPE.NPC ||
      node.type === NODE_TYPE.STORYLET ||
      node.type === NODE_TYPE.STORYLET_POOL) &&
    node.nextNodeId
  ) {
    childIds.push(node.nextNodeId);
  }

  // PLAYER: multiple choices
  if (node.type === NODE_TYPE.PLAYER && node.choices) {
    node.choices.forEach((choice) => {
      if (choice.nextNodeId) {
        childIds.push(choice.nextNodeId);
      }
    });
  }

  // CONDITIONAL: multiple blocks
  if (node.type === NODE_TYPE.CONDITIONAL && node.conditionalBlocks) {
    node.conditionalBlocks.forEach((block) => {
      if (block.nextNodeId) {
        childIds.push(block.nextNodeId);
      }
    });
  }

  return childIds;
}

/**
 * Build a tree structure from DialogueTree starting from a root node
 * Note: This creates a tree view where each node appears once (first path found).
 * For nodes with multiple parents, only the first path is included.
 */
function buildTreeStructure(
  dialogue: ForgeGraph,
  rootNodeId: string,
  visited: Set<string> = new Set()
): TreeNodeData | null {
  const rootNode = dialogue.nodes[rootNodeId];
  if (!rootNode) {
    return null;
  }

  // Prevent cycles
  if (visited.has(rootNodeId)) {
    return null;
  }
  visited.add(rootNodeId);

  const childIds = getChildNodeIds(rootNode);
  const children: TreeNodeData[] = [];

  for (const childId of childIds) {
    const childTree = buildTreeStructure(dialogue, childId, visited);
    if (childTree) {
      children.push(childTree);
    }
  }

  const result: TreeNodeData = {
    nodeId: rootNodeId,
    node: rootNode,
  };

  if (children.length > 0) {
    result.children = children;
  }

  return result;
}

/**
 * Convert DialogueTree to d3.hierarchy
 */
export function createTreeHierarchy(
  dialogue: ForgeGraph
): HierarchyNode<TreeNodeData> | null {
  if (!dialogue.startNodeId || !dialogue.nodes[dialogue.startNodeId]) {
    return null;
  }

  const treeData = buildTreeStructure(dialogue, dialogue.startNodeId);
  if (!treeData) {
    return null;
  }

  return hierarchy(treeData, (d) => d.children);
}

/**
 * Find a node in the hierarchy by ID
 */
export function findNode(
  hierarchy: HierarchyNode<TreeNodeData> | null,
  nodeId: string
): HierarchyNode<TreeNodeData> | null {
  if (!hierarchy) {
    return null;
  }

  let found: HierarchyNode<TreeNodeData> | null = null;

  hierarchy.each((node) => {
    if (node.data.nodeId === nodeId) {
      found = node;
    }
  });

  return found;
}

/**
 * Get path from one node to another
 * Returns array of node IDs from fromId to toId (inclusive), or null if no path exists
 */
export function findPath(
  hierarchy: HierarchyNode<TreeNodeData> | null,
  fromId: string,
  toId: string
): string[] | null {
  const fromNode = findNode(hierarchy, fromId);
  const toNode = findNode(hierarchy, toId);

  if (!fromNode || !toNode) {
    return null;
  }

  // If same node, return single node path
  if (fromId === toId) {
    return [fromId];
  }

  // Check if toNode is a descendant of fromNode
  const path: string[] = [fromId];
  let current: HierarchyNode<TreeNodeData> | null = toNode;

  // Walk up from toNode to fromNode
  while (current && current.data.nodeId !== fromId) {
    path.push(current.data.nodeId);
    current = current.parent;
    if (!current) {
      return null; // No path found
    }
  }

  return path.reverse();
}

/**
 * Get all ancestors of a node (from root to node, excluding the node itself)
 */
export function getAncestors(
  hierarchy: HierarchyNode<TreeNodeData> | null,
  nodeId: string
): string[] {
  const node = findNode(hierarchy, nodeId);
  if (!node) {
    return [];
  }

  const ancestors: string[] = [];
  let current: HierarchyNode<TreeNodeData> | null = node.parent;

  while (current) {
    ancestors.unshift(current.data.nodeId);
    current = current.parent;
  }

  return ancestors;
}

/**
 * Get all descendants of a node (excluding the node itself)
 */
export function getDescendants(
  hierarchy: HierarchyNode<TreeNodeData> | null,
  nodeId: string
): string[] {
  const node = findNode(hierarchy, nodeId);
  if (!node) {
    return [];
  }

  const descendants: string[] = [];

  node.each((descendant) => {
    if (descendant.data.nodeId !== nodeId) {
      descendants.push(descendant.data.nodeId);
    }
  });

  return descendants;
}

/**
 * Get depth of a node in the tree (0 for root)
 */
export function getNodeDepth(
  hierarchy: HierarchyNode<TreeNodeData> | null,
  nodeId: string
): number {
  const node = findNode(hierarchy, nodeId);
  if (!node) {
    return -1;
  }

  let depth = 0;
  let current: HierarchyNode<TreeNodeData> | null = node.parent;

  while (current) {
    depth++;
    current = current.parent;
  }

  return depth;
}

/**
 * Get height of a node (longest path from node to leaf)
 */
export function getNodeHeight(
  hierarchy: HierarchyNode<TreeNodeData> | null,
  nodeId: string
): number {
  const node = findNode(hierarchy, nodeId);
  if (!node) {
    return -1;
  }

  // Use d3's height calculation
  return node.height;
}

/**
 * Validate tree structure integrity
 * Checks for:
 * - Missing start node
 * - Orphaned nodes (not reachable from start)
 * - Invalid node references
 */
export function validateTreeStructure(dialogue: ForgeGraph): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check start node exists
  if (!dialogue.startNodeId) {
    errors.push('Dialogue tree has no startNodeId');
    return { valid: false, errors };
  }

  if (!dialogue.nodes[dialogue.startNodeId]) {
    errors.push(`Start node "${dialogue.startNodeId}" does not exist in nodes`);
    return { valid: false, errors };
  }

  // Check all node references are valid
  const visited = new Set<string>();
  const toVisit = [dialogue.startNodeId];

  while (toVisit.length > 0) {
    const nodeId = toVisit.shift()!;
    if (visited.has(nodeId)) {
      continue; // Already visited (cycle detected, but we continue)
    }
    visited.add(nodeId);

    const node = dialogue.nodes[nodeId];
    if (!node) {
      errors.push(`Node "${nodeId}" referenced but does not exist`);
      continue;
    }

    const childIds = getChildNodeIds(node);
    for (const childId of childIds) {
      if (!dialogue.nodes[childId]) {
        errors.push(
          `Node "${nodeId}" references non-existent node "${childId}"`
        );
      } else if (!visited.has(childId)) {
        toVisit.push(childId);
      }
    }
  }

  // Check for orphaned nodes
  const allNodeIds = new Set(Object.keys(dialogue.nodes));
  for (const nodeId of allNodeIds) {
    if (!visited.has(nodeId) && nodeId !== dialogue.startNodeId) {
      errors.push(`Node "${nodeId}" is not reachable from start node`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all nodes in the hierarchy as a flat array
 */
export function getAllNodes(
  hierarchy: HierarchyNode<TreeNodeData> | null
): HierarchyNode<TreeNodeData>[] {
  if (!hierarchy) {
    return [];
  }

  const nodes: HierarchyNode<TreeNodeData>[] = [];

  hierarchy.each((node) => {
    nodes.push(node);
  });

  return nodes;
}

/**
 * Count total nodes in the hierarchy
 */
export function countNodes(
  hierarchy: HierarchyNode<TreeNodeData> | null
): number {
  if (!hierarchy) {
    return 0;
  }

  let count = 0;
  hierarchy.each(() => {
    count++;
  });

  return count;
}
