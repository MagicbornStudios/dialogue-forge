/**
 * Dagre Layout Strategy
 * 
 * Hierarchical layout using the dagre library.
 * Best for graphs with clear start-to-end flow.
 * 
 * @see https://github.com/dagrejs/dagre
 * @see https://reactflow.dev/examples/layout/dagre
 */

import dagre from '@dagrejs/dagre';
import type { ForgeGraphDoc, ForgeReactFlowNode, ForgeNode } from '@magicborn/forge/types/forge-graph';
import { LayoutStrategy, LayoutOptions, LayoutResult, LayoutDirection } from '../types';

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const EXTRA_HEIGHT_PER_ITEM = 30;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate depth of each node from start using BFS
 */
function calculateNodeDepths(graph: ForgeGraphDoc): Map<string, number> {
  const depths = new Map<string, number>();
  if (!graph.startNodeId) return depths;
  
  const nodesById = new Map<string, ForgeReactFlowNode>();
  for (const node of graph.flow.nodes) {
    nodesById.set(node.id, node);
  }
  
  const queue: Array<{ id: string; depth: number }> = [
    { id: graph.startNodeId, depth: 0 }
  ];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    depths.set(id, depth);
    
    const node = nodesById.get(id);
    if (!node) continue;
    
    // Get connected nodes from edges
    const nextIds = graph.flow.edges
      .filter(e => e.source === id)
      .map(e => e.target);
    
    for (const nextId of nextIds) {
      if (nodesById.has(nextId) && !visited.has(nextId)) {
        queue.push({ id: nextId, depth: depth + 1 });
      }
    }
  }
  
  return depths;
}

/**
 * Estimate node height based on content
 */
function estimateNodeHeight(node: ForgeReactFlowNode): number {
  const nodeData = (node.data ?? {}) as ForgeNode;
  const itemCount = Math.max(
    nodeData.choices?.length || 0,
    nodeData.conditionalBlocks?.length || 0
  );
  return NODE_HEIGHT + itemCount * EXTRA_HEIGHT_PER_ITEM;
}

// ============================================================================
// Strategy Implementation
// ============================================================================

export class DagreLayoutStrategy implements LayoutStrategy {
  readonly id = 'dagre';
  readonly name = 'Dagre (Hierarchical)';
  readonly description = 'Hierarchical layout that flows from start to end. Best for linear graphs with branches.';
  
  readonly defaultOptions: Partial<LayoutOptions> = {
    direction: 'TB',
    nodeSpacingX: 80,
    nodeSpacingY: 120,
    margin: 50,
  };

  apply(graph: ForgeGraphDoc, options?: LayoutOptions): LayoutResult {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };
    const direction: LayoutDirection = opts.direction || 'TB';
    const isHorizontal = direction === 'LR';
    
    // Create dagre graph
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    
    // Configure layout
    g.setGraph({
      rankdir: direction,
      nodesep: isHorizontal ? opts.nodeSpacingX : opts.nodeSpacingY,
      ranksep: isHorizontal ? opts.nodeSpacingY : opts.nodeSpacingX,
      marginx: opts.margin,
      marginy: opts.margin,
      ranker: 'network-simplex',
      align: 'UL',
      acyclicer: 'greedy',
      edgesep: 15,
    });

    // Add nodes ordered by depth
    const nodeDepths = calculateNodeDepths(graph);
    const sortedNodes = [...graph.flow.nodes].sort((a, b) => {
      return (nodeDepths.get(a.id) ?? Infinity) - (nodeDepths.get(b.id) ?? Infinity);
    });
    
    for (const node of sortedNodes) {
      g.setNode(node.id, { 
        width: NODE_WIDTH, 
        height: estimateNodeHeight(node),
      });
    }

    // Add edges from flow.edges
    for (const edge of graph.flow.edges) {
      const sourceNode = graph.flow.nodes.find(n => n.id === edge.source);
      const targetNode = graph.flow.nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        g.setEdge(edge.source, edge.target, { weight: 2, minlen: 1 });
      }
    }

    // Run layout
    dagre.layout(g);

    // Extract positions and calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const updatedNodes: ForgeReactFlowNode[] = [];
    
    for (const node of graph.flow.nodes) {
      const dagreNode = g.node(node.id);
      
      if (dagreNode) {
        const x = dagreNode.x - NODE_WIDTH / 2;
        const y = dagreNode.y - NODE_HEIGHT / 2;
        
        updatedNodes.push({
          ...node,
          position: { x, y },
        });
        
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + NODE_WIDTH);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
      } else {
        // Orphan node - keep existing position
        updatedNodes.push(node);
      }
    }

    // Ensure start node is at edge
    const startNodeId = graph.startNodeId;
    if (startNodeId) {
      const startNode = updatedNodes.find(n => n.id === startNodeId);
      if (startNode) {
        const threshold = 50;
        if (isHorizontal && startNode.position.x - minX > threshold) {
          startNode.position.x = minX;
        } else if (!isHorizontal && startNode.position.y - minY > threshold) {
          startNode.position.y = minY;
        }
      }
    }

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
        nodeCount: graph.flow.nodes.length,
        bounds: {
          minX, minY, maxX, maxY,
          width: maxX - minX,
          height: maxY - minY,
        },
      },
    };
  }

  supports(graph: ForgeGraphDoc): boolean {
    // Dagre works best with connected graphs that have a clear start
    return !!graph.startNodeId && graph.flow.nodes.length > 0;
  }
}
