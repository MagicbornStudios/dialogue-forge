/**
 * Node Collision Resolution
 * 
 * Utility for resolving overlapping nodes in freeform layout.
 * Iteratively pushes overlapping nodes apart until stable.
 * 
 * @see https://reactflow.dev/examples/layout/node-collisions
 */

import { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import { LAYOUT_CONSTANTS } from '@magicborn/forge/lib/utils/constants';
import { ForgeReactFlowNode, ForgeNode } from '@magicborn/forge/types/forge-graph';

// ============================================================================
// Local Layout Constants
// ============================================================================
// Note: Using LAYOUT_CONSTANTS from utils/constants for shared values
// These local constants are specific to collision resolution

/** Collision-specific node dimensions */
const COLLISION_NODE_WIDTH = 220;
const COLLISION_NODE_HEIGHT = 120;

interface CollisionOptions {
  /** Maximum iterations before giving up */
  maxIterations?: number;
  /** Overlap ratio threshold to trigger resolution (0-1) */
  overlapThreshold?: number;
  /** Extra margin to add when pushing nodes apart */
  margin?: number;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Resolve node collisions for freeform layout.
 * Iteratively pushes overlapping nodes apart until no collisions remain.
 * 
 * @param graph - The dialogue tree with potentially overlapping nodes
 * @param options - Configuration options
 * @returns Updated dialogue tree with resolved positions
 */
export function resolveNodeCollisions(
  graph: ForgeGraphDoc,
  options: CollisionOptions = {}
): ForgeGraphDoc {
  const { 
    maxIterations = LAYOUT_CONSTANTS.MAX_ITERATIONS, 
    overlapThreshold = LAYOUT_CONSTANTS.OVERLAP_THRESHOLD, 
    margin = LAYOUT_CONSTANTS.DEFAULT_MARGIN 
  } = options;

  // Create mutable position array
  const nodePositions = Object.values(graph.flow.nodes).map(node => ({
    id: node.id as string,
    x: node.position?.x || 0,
    y: node.position?.y || 0,
    width: COLLISION_NODE_WIDTH,
    height: COLLISION_NODE_HEIGHT,
  }));

  // Iteratively resolve collisions
  for (let iter = 0; iter < maxIterations; iter++) {
    let hasCollision = false;

    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const a = nodePositions[i];
        const b = nodePositions[j];

        // Calculate overlap
        const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

        if (overlapX > 0 && overlapY > 0) {
          const overlapRatio = (overlapX * overlapY) / Math.min(a.width * a.height, b.width * b.height);
          
          if (overlapRatio > overlapThreshold) {
            hasCollision = true;
            
            // Calculate push direction (center to center)
            const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
            const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Push apart
            const pushX = (dx / dist) * (overlapX / 2 + margin);
            const pushY = (dy / dist) * (overlapY / 2 + margin);
            
            a.x -= pushX / 2;
            a.y -= pushY / 2;
            b.x += pushX / 2;
            b.y += pushY / 2;
          }
        }
      }
    }

    // Exit early if no collisions found
    if (!hasCollision) break;
  }

  // Build updated dialogue with new positions
  const updatedNodes: Record<string, ForgeNode> = {};
  for (const pos of nodePositions) {
    updatedNodes[pos.id] = { ...graph.flow.nodes[pos.id as unknown as number].data, x: pos.x, y: pos.y };
  }

  return { ...graph, flow: { ...graph.flow, nodes: Object.values(updatedNodes) as ForgeReactFlowNode[] } };
}




