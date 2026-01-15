/**
 * Grid Layout Strategy
 * 
 * Simple grid-based layout that arranges nodes in rows and columns.
 * Useful for getting a quick overview of all nodes.
 */

import type { ForgeGraphDoc, ForgeReactFlowNode } from '@/src/types/forge/forge-graph';
import { LayoutStrategy, LayoutOptions, LayoutResult } from '../types';

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

// ============================================================================
// Strategy Implementation
// ============================================================================

export class GridLayoutStrategy implements LayoutStrategy {
  readonly id = 'grid';
  readonly name = 'Grid';
  readonly description = 'Arranges nodes in a simple grid pattern. Good for viewing all nodes at once.';
  
  readonly defaultOptions: Partial<LayoutOptions> = {
    nodeSpacingX: 50,
    nodeSpacingY: 50,
    margin: 50,
  };

  apply(graph: ForgeGraphDoc, options?: LayoutOptions): LayoutResult {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };
    const margin = opts.margin || 50;
    const spacingX = opts.nodeSpacingX || 50;
    const spacingY = opts.nodeSpacingY || 50;
    
    const nodes = graph.flow.nodes;
    if (nodes.length === 0) {
      return this.emptyResult(graph, startTime);
    }

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const cellWidth = NODE_WIDTH + spacingX;
    const cellHeight = NODE_HEIGHT + spacingY;

    // Sort nodes: start node first, then by ID
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.id === graph.startNodeId) return -1;
      if (b.id === graph.startNodeId) return 1;
      return a.id.localeCompare(b.id);
    });

    // Position nodes in grid
    const updatedNodes: ForgeReactFlowNode[] = [];
    let maxX = 0;
    let maxY = 0;
    
    sortedNodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = margin + col * cellWidth;
      const y = margin + row * cellHeight;
      
      updatedNodes.push({
        ...node,
        position: { x, y },
      });
      
      maxX = Math.max(maxX, x + NODE_WIDTH);
      maxY = Math.max(maxY, y + NODE_HEIGHT);
    });

    const computeTimeMs = performance.now() - startTime;

    return {
      graph: {
        ...graph,
        flow: {
          ...graph.flow,
          nodes: updatedNodes,
        },
      },
      metadata: {
        computeTimeMs,
        nodeCount: nodes.length,
        bounds: {
          minX: margin,
          minY: margin,
          maxX,
          maxY,
          width: maxX - margin,
          height: maxY - margin,
        },
      },
    };
  }

  private emptyResult(graph: ForgeGraphDoc, startTime: number): LayoutResult {
    return {
      graph,
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
