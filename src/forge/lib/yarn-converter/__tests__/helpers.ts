/**
 * Test Helpers for Yarn Converter Tests
 * 
 * Provides utilities for creating mock nodes, graphs, and contexts
 * for testing the yarn converter system.
 */

import type { ForgeGraphDoc, ForgeReactFlowNode, ForgeNode, ForgeNodeType, ForgeConditionalBlock } from '@/forge/types/forge-graph';
import type { YarnConverterContext } from '../types';
import { FORGE_NODE_TYPE, FORGE_GRAPH_KIND } from '@/forge/types/forge-graph';
import { createEmptyForgeGraphDoc } from '@/forge/components/ForgeWorkspace/components/GraphEditors/utils/forge-flow-helpers';

/**
 * Create a mock ForgeFlowNode for testing
 */
export function createMockForgeFlowNode(
  id: string,
  type: ForgeNodeType,
  data: Partial<ForgeNode> = {},
  position: { x: number; y: number } = { x: 0, y: 0 }
): ForgeReactFlowNode {
  const nodeData: ForgeNode = {
    id,
    type,
    ...data,
  } as ForgeNode;

  return {
    id,
    type: 'default',
    position,
    data: nodeData,
  };
}

/**
 * Create a mock ForgeGraphDoc for testing
 */
export function createMockForgeGraphDoc(
  title: string = 'Test Graph',
  nodes: ForgeReactFlowNode[] = [],
  startNodeId?: string
): ForgeGraphDoc {
  const graph = createEmptyForgeGraphDoc({
    projectId: 1,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title,
  });

  return {
    ...graph,
    startNodeId: startNodeId || nodes[0]?.id || 'start',
    flow: {
      ...graph.flow,
      nodes,
      edges: [],
    },
  };
}

/**
 * Create a mock YarnConverterContext for testing
 */
export function createMockYarnConverterContext(
  options: {
    adapter?: any;
    cache?: Map<string, ForgeGraphDoc>;
    visitedGraphs?: Set<number>;
  } = {}
): YarnConverterContext {
  const { adapter, cache = new Map(), visitedGraphs = new Set() } = options;

  return {
    workspaceStore: undefined,
    getGraphFromCache: (graphId: string) => cache.get(graphId),
    ensureGraph: async (graphId: string) => {
      const cached = cache.get(graphId);
      if (cached) return cached;
      
      if (adapter) {
        const graph = await adapter.getGraph(Number(graphId));
        cache.set(graphId, graph);
        return graph;
      }
      
      throw new Error(`No graph found for ID: ${graphId}`);
    },
    visitedGraphs,
  };
}

/**
 * Create a mock ForgeDataAdapter for testing
 */
export function createMockAdapter() {
  const graphs = new Map<number, ForgeGraphDoc>();

  return {
    getGraph: async (id: number): Promise<ForgeGraphDoc> => {
      const graph = graphs.get(id);
      if (!graph) {
        throw new Error(`Graph ${id} not found`);
      }
      return graph;
    },
    setGraph: (id: number, graph: ForgeGraphDoc) => {
      graphs.set(id, graph);
    },
    hasGraph: (id: number): boolean => graphs.has(id),
  };
}

/**
 * Parse a single Yarn node block from text
 */
export function parseYarnNode(yarnText: string): import('../types').YarnNodeBlock {
  const titleMatch = yarnText.match(/title:\s*(\S+)/);
  if (!titleMatch) {
    throw new Error('No title found in Yarn node');
  }

  const nodeId = titleMatch[1];
  const contentStart = yarnText.indexOf('---');
  if (contentStart === -1) {
    throw new Error('No separator found in Yarn node');
  }

  const contentEnd = yarnText.indexOf('===');
  const content = contentEnd !== -1
    ? yarnText.slice(contentStart + 3, contentEnd).trim()
    : yarnText.slice(contentStart + 3).trim();

  const lines = content.split('\n').filter(l => l.trim());

  return {
    nodeId,
    lines,
    rawContent: content,
  };
}

/**
 * Normalize Yarn text for comparison (removes extra whitespace)
 */
export function normalizeYarn(yarnText: string): string {
  return yarnText
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .trim();
}

/**
 * Create a simple character node for testing
 */
export function createSimpleCharacterNode(
  id: string = 'char1',
  content: string = 'Hello!',
  speaker?: string
): ForgeReactFlowNode {
  return createMockForgeFlowNode(id, FORGE_NODE_TYPE.CHARACTER, {
    content,
    speaker,
  });
}

/**
 * Create a simple player node for testing
 */
export function createSimplePlayerNode(
  id: string = 'player1',
  choices: Array<{ text: string; nextNodeId?: string }> = []
): ForgeReactFlowNode {
  return createMockForgeFlowNode(id, FORGE_NODE_TYPE.PLAYER, {
    choices: choices.map((c, i) => ({
      id: `choice_${i}`,
      text: c.text,
      nextNodeId: c.nextNodeId,
    })),
  });
}

/**
 * Create a simple conditional node for testing
 */
export function createSimpleConditionalNode(
  id: string = 'cond1',
  blocks: Array<{
    type: 'if' | 'elseif' | 'else';
    condition?: Array<{ flag: string; operator: string; value?: any }>;
    content?: string;
  }> = []
): ForgeReactFlowNode {
  return createMockForgeFlowNode(id, FORGE_NODE_TYPE.CONDITIONAL, {
    conditionalBlocks: blocks.map((b, i) => ({
      id: `block_${i}`,
      type: b.type,
      condition: b.condition,
      content: b.content,
    }) as ForgeConditionalBlock),
  });
}
