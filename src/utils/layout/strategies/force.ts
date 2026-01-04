/**
 * Force-Directed Layout Strategy
 * 
 * Physics-based layout that spreads nodes evenly.
 * Good for exploring graph structure without hierarchy.
 * 
 * Uses a simple force simulation:
 * - Nodes repel each other (like charged particles)
 * - Connected nodes attract (like springs)
 */

import { DialogueTree, DialogueNode } from '../../../types';
import { LayoutStrategy, LayoutOptions, LayoutResult } from '../types';

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

// Force simulation parameters
const REPULSION_STRENGTH = 5000;   // How strongly nodes push each other
const ATTRACTION_STRENGTH = 0.1;   // How strongly edges pull nodes together
const DAMPING = 0.9;               // Velocity reduction per iteration
const MAX_ITERATIONS = 100;        // Maximum simulation steps
const MIN_MOVEMENT = 0.5;          // Stop when movement is below this

// ============================================================================
// Types
// ============================================================================

interface NodeState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getConnectedNodeIds(node: DialogueNode): string[] {
  const ids: string[] = [];
  if (node.nextNodeId) ids.push(node.nextNodeId);
  node.choices?.forEach(c => c.nextNodeId && ids.push(c.nextNodeId));
  node.conditionalBlocks?.forEach(b => b.nextNodeId && ids.push(b.nextNodeId));
  return ids;
}

// ============================================================================
// Strategy Implementation
// ============================================================================

export class ForceLayoutStrategy implements LayoutStrategy {
  readonly id = 'force';
  readonly name = 'Force-Directed';
  readonly description = 'Physics-based layout that spreads nodes evenly. Good for exploring complex graphs.';
  
  readonly defaultOptions: Partial<LayoutOptions> = {
    nodeSpacingX: 300,
    nodeSpacingY: 200,
    margin: 50,
  };

  apply(dialogue: DialogueTree, options?: LayoutOptions): LayoutResult {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };
    
    const nodeIds = Object.keys(dialogue.nodes);
    if (nodeIds.length === 0) {
      return this.emptyResult(dialogue, startTime);
    }

    // Initialize node positions in a circle
    const states: Map<string, NodeState> = new Map();
    const centerX = 500;
    const centerY = 500;
    const radius = Math.max(200, nodeIds.length * 30);
    
    nodeIds.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / nodeIds.length;
      states.set(id, {
        id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      });
    });

    // Build edge list for attraction
    const edges: Array<{ source: string; target: string }> = [];
    for (const node of Object.values(dialogue.nodes)) {
      for (const targetId of getConnectedNodeIds(node)) {
        if (dialogue.nodes[targetId]) {
          edges.push({ source: node.id, target: targetId });
        }
      }
    }

    // Run force simulation
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let maxMovement = 0;

      // Calculate repulsion forces between all node pairs
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const a = states.get(nodeIds[i])!;
          const b = states.get(nodeIds[j])!;
          
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Repulsion force (inverse square law)
          const force = REPULSION_STRENGTH / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // Calculate attraction forces along edges
      for (const edge of edges) {
        const source = states.get(edge.source);
        const target = states.get(edge.target);
        if (!source || !target) continue;
        
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Attraction force (Hooke's law)
        const force = dist * ATTRACTION_STRENGTH;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }

      // Apply velocities with damping
      for (const state of states.values()) {
        state.x += state.vx;
        state.y += state.vy;
        state.vx *= DAMPING;
        state.vy *= DAMPING;
        
        maxMovement = Math.max(
          maxMovement,
          Math.abs(state.vx) + Math.abs(state.vy)
        );
      }

      // Early exit if stable
      if (maxMovement < MIN_MOVEMENT) break;
    }

    // Calculate bounds and apply positions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const updatedNodes: Record<string, DialogueNode> = {};
    
    for (const [id, state] of states) {
      const node = dialogue.nodes[id];
      updatedNodes[id] = { ...node, x: state.x, y: state.y };
      
      minX = Math.min(minX, state.x);
      maxX = Math.max(maxX, state.x + NODE_WIDTH);
      minY = Math.min(minY, state.y);
      maxY = Math.max(maxY, state.y + NODE_HEIGHT);
    }

    // Normalize to start from margin
    const margin = opts.margin || 50;
    const offsetX = margin - minX;
    const offsetY = margin - minY;
    
    for (const id of nodeIds) {
      updatedNodes[id].x += offsetX;
      updatedNodes[id].y += offsetY;
    }

    const computeTimeMs = performance.now() - startTime;

    return {
      dialogue: { ...dialogue, nodes: updatedNodes },
      metadata: {
        computeTimeMs,
        nodeCount: nodeIds.length,
        bounds: {
          minX: margin,
          minY: margin,
          maxX: maxX + offsetX,
          maxY: maxY + offsetY,
          width: maxX - minX,
          height: maxY - minY,
        },
      },
    };
  }

  private emptyResult(dialogue: DialogueTree, startTime: number): LayoutResult {
    return {
      dialogue,
      metadata: {
        computeTimeMs: performance.now() - startTime,
        nodeCount: 0,
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
      },
    };
  }

  supports(): boolean {
    return true; // Works with any graph
  }
}




