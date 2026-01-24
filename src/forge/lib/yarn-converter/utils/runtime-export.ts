import type { ForgeGraphDoc, ForgeReactFlowEdge, ForgeReactFlowNode, ForgeNodeType } from '@/forge/types/forge-graph';
import { isRuntimeOnlyNodeType } from '@/shared/types';

export type RuntimeExportDiagnostics = {
  ignoredRuntimeNodes: Array<{ id: string; type: ForgeNodeType }>;
  removedEdges: Array<{ id?: string; source: string; target: string }>;
  inlineRuntimeChains: Array<{ from: string; to: string; via: string[] }>;
};

export type PreparedYarnExportGraph = {
  nodes: ForgeReactFlowNode[];
  edges: ForgeReactFlowEdge[];
  runtimeNodeIds: Set<string>;
  diagnostics: RuntimeExportDiagnostics;
};

const sanitizeRuntimeLinks = (
  node: ForgeReactFlowNode,
  runtimeNodeIds: Set<string>
): ForgeReactFlowNode => {
  if (!node.data) {
    return node;
  }

  const data = { ...node.data };
  data.runtimeDirectives = undefined;
  data.presentation = undefined;

  if (data.defaultNextNodeId && runtimeNodeIds.has(data.defaultNextNodeId)) {
    data.defaultNextNodeId = undefined;
  }

  if (data.choices) {
    data.choices = data.choices.map((choice: { nextNodeId?: string; [key: string]: unknown }) => {
      if (choice.nextNodeId && runtimeNodeIds.has(choice.nextNodeId)) {
        return { ...choice, nextNodeId: undefined };
      }
      return choice;
    });
  }

  if (data.conditionalBlocks) {
    data.conditionalBlocks = data.conditionalBlocks.map((block: { nextNodeId?: string; [key: string]: unknown }) => {
      if (block.nextNodeId && runtimeNodeIds.has(block.nextNodeId)) {
        return { ...block, nextNodeId: undefined };
      }
      return block;
    });
  }

  return {
    ...node,
    data,
  };
};

const buildEdgeLookup = (edges: ForgeReactFlowEdge[]): Map<string, string[]> => {
  const lookup = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!edge.source || !edge.target) return;
    const existing = lookup.get(edge.source);
    if (existing) {
      existing.push(edge.target);
    } else {
      lookup.set(edge.source, [edge.target]);
    }
  });
  return lookup;
};

const findInlineRuntimeChains = (
  edges: ForgeReactFlowEdge[],
  runtimeNodeIds: Set<string>,
  yarnNodeIds: Set<string>
): Array<{ from: string; to: string; via: string[] }> => {
  const chains: Array<{ from: string; to: string; via: string[] }> = [];
  const edgeLookup = buildEdgeLookup(edges);
  const chainKeys = new Set<string>();

  yarnNodeIds.forEach(startId => {
    const nextIds = edgeLookup.get(startId) ?? [];
    nextIds.forEach(nextId => {
      if (!runtimeNodeIds.has(nextId)) return;
      const queue: Array<{ current: string; path: string[] }> = [{ current: nextId, path: [nextId] }];
      const visited = new Set<string>([nextId]);

      while (queue.length) {
        const { current, path } = queue.shift()!;
        const targets = edgeLookup.get(current) ?? [];
        targets.forEach(targetId => {
          if (runtimeNodeIds.has(targetId)) {
            if (!visited.has(targetId)) {
              visited.add(targetId);
              queue.push({ current: targetId, path: [...path, targetId] });
            }
            return;
          }

          if (yarnNodeIds.has(targetId)) {
            const key = `${startId}->${targetId}:${path.join(',')}`;
            if (!chainKeys.has(key)) {
              chainKeys.add(key);
              chains.push({ from: startId, to: targetId, via: path });
            }
          }
        });
      }
    });
  });

  return chains;
};

export const prepareGraphForYarnExport = (graph: ForgeGraphDoc): PreparedYarnExportGraph => {
  const ignoredRuntimeNodes: Array<{ id: string; type: ForgeNodeType }> = [];
  const runtimeNodeIds = new Set<string>();
  const yarnNodeIds = new Set<string>();
  graph.flow.nodes.forEach(node => {
    if (!node.id || !node.data?.type) return;
    if (isRuntimeOnlyNodeType(node.data.type)) {
      runtimeNodeIds.add(node.id);
      ignoredRuntimeNodes.push({ id: node.id, type: node.data.type });
    } else {
      yarnNodeIds.add(node.id);
    }
  });

  const removedEdges: Array<{ id?: string; source: string; target: string }> = [];
  const filteredEdges = graph.flow.edges.filter(edge => {
    if (!edge.source || !edge.target) return false;
    if (runtimeNodeIds.has(edge.source) || runtimeNodeIds.has(edge.target)) {
      removedEdges.push({ id: edge.id, source: edge.source, target: edge.target });
      return false;
    }
    return true;
  });

  const filteredNodes = graph.flow.nodes
    .filter(node => {
      if (!node.data?.type) return true;
      return !isRuntimeOnlyNodeType(node.data.type);
    })
    .map(node => sanitizeRuntimeLinks(node, runtimeNodeIds));

  const inlineRuntimeChains = findInlineRuntimeChains(
    graph.flow.edges,
    runtimeNodeIds,
    yarnNodeIds
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    runtimeNodeIds,
    diagnostics: {
      ignoredRuntimeNodes,
      removedEdges,
      inlineRuntimeChains,
    },
  };
};

export const logRuntimeExportDiagnostics = (
  graph: ForgeGraphDoc,
  diagnostics: RuntimeExportDiagnostics
): void => {
  if (diagnostics.ignoredRuntimeNodes.length > 0) {
    const ignoredList = diagnostics.ignoredRuntimeNodes
      .map(node => `${node.id}:${node.type}`)
      .join(', ');
    console.debug(
      `[Yarn Export] Ignored runtime-only nodes in graph ${graph.id} (${graph.title}): ${ignoredList}`
    );
  }

  if (diagnostics.inlineRuntimeChains.length > 0) {
    const chainList = diagnostics.inlineRuntimeChains
      .map(chain => `${chain.from} -> ${chain.via.join(' -> ')} -> ${chain.to}`)
      .join('; ');
    console.warn(
      `[Yarn Export] Runtime-only nodes chained between Yarn nodes in graph ${graph.id} (${graph.title}): ${chainList}`
    );
  }
};
