/**
 * Node Collision Resolution
 * 
 * Utility for resolving overlapping nodes in freeform layout.
 * Iteratively pushes overlapping nodes apart until stable.
 * 
 * @see https://reactflow.dev/examples/layout/node-collisions
 */

import { DialogueTree, DialogueNode } from '../../types';

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

// ============================================================================
// Types
// ============================================================================

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
 * @param dialogue - The dialogue tree with potentially overlapping nodes
 * @param options - Configuration options
 * @returns Updated dialogue tree with resolved positions
 */
export function resolveNodeCollisions(
  dialogue: DialogueTree,
  options: CollisionOptions = {}
): DialogueTree {
  const { maxIterations = 50, overlapThreshold = 0.3, margin = 20 } = options;

  // Create mutable position array
  const nodePositions = Object.values(dialogue.nodes).map(node => ({
    id: node.id,
    x: node.x,
    y: node.y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
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
  const updatedNodes: Record<string, DialogueNode> = {};
  for (const pos of nodePositions) {
    updatedNodes[pos.id] = { ...dialogue.nodes[pos.id], x: pos.x, y: pos.y };
  }

  return { ...dialogue, nodes: updatedNodes };
}




