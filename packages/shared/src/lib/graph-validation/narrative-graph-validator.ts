import type { ForgeGraphDoc } from '@magicborn/shared/types/forge-graph';
import { FORGE_EDGE_KIND, FORGE_NODE_TYPE } from '@magicborn/shared/types/forge-graph';
import { PAGE_TYPE, type PageType } from '@magicborn/shared/types/narrative';

type GraphValidationIssueType =
  | 'orphaned_node'
  | 'missing_start'
  | 'disconnected_subgraph'
  | 'invalid_hierarchy'
  | 'dangling_edge'
  | 'invalid_edge_kind';

export type GraphValidationError = {
  id: string;
  type: GraphValidationIssueType;
  message: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  graphId?: number;
};

export type GraphValidationResult = {
  valid: boolean;
  errors: GraphValidationError[];
  warnings: GraphValidationError[];
};

const VALID_EDGE_KINDS = new Set(Object.values(FORGE_EDGE_KIND));

const buildIssueId = (type: GraphValidationIssueType, subjectId: string) => `${type}:${subjectId}`;

const buildFallbackEdgeId = (edge: { source: string; target: string; sourceHandle?: string | null }) => {
  if (edge.sourceHandle) {
    return `edge_${edge.source}_${edge.sourceHandle}_${edge.target}`;
  }
  return `edge_${edge.source}_${edge.target}`;
};

export function validateNarrativeGraph(graph: ForgeGraphDoc): GraphValidationResult {
  const errors: GraphValidationError[] = [];
  const warnings: GraphValidationError[] = [];

  const nodes = graph.flow.nodes;
  const edges = graph.flow.edges;
  const nodeCount = nodes.length;

  if (nodeCount === 0) {
    return { valid: true, errors: [], warnings: [] };
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!graph.startNodeId || !nodeIds.has(graph.startNodeId)) {
    const missingId = graph.startNodeId || `graph-${graph.id}`;
    errors.push({
      id: buildIssueId('missing_start', missingId),
      type: 'missing_start',
      message: 'Start node is missing or does not exist in the graph',
      nodeId: graph.startNodeId || missingId,
      graphId: graph.id,
      severity: 'error',
    });
  }

  if (nodeCount > 1) {
    const nodesWithIncoming = new Set(edges.map((edge) => edge.target));
    const nodesWithOutgoing = new Set(edges.map((edge) => edge.source));

    nodes.forEach((node) => {
      if (node.id === graph.startNodeId) {
        return;
      }

      const hasIncoming = nodesWithIncoming.has(node.id);
      const hasOutgoing = nodesWithOutgoing.has(node.id);

      if (!hasIncoming && !hasOutgoing) {
        errors.push({
          id: buildIssueId('orphaned_node', node.id),
          type: 'orphaned_node',
          message: `Node "${node.data?.title || node.id}" is completely isolated`,
          nodeId: node.id,
          severity: 'error',
        });
      } else if (!hasIncoming) {
        errors.push({
          id: buildIssueId('orphaned_node', node.id),
          type: 'orphaned_node',
          message: `Node "${node.data?.title || node.id}" has no incoming edges`,
          nodeId: node.id,
          severity: 'error',
        });
      }
    });
  }

  if (graph.startNodeId && nodeIds.has(graph.startNodeId)) {
    const visited = new Set<string>();
    const stack = [graph.startNodeId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);
      edges
        .filter((edge) => edge.source === current)
        .forEach((edge) => {
          if (nodeIds.has(edge.target)) {
            stack.push(edge.target);
          }
        });
    }

    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        errors.push({
          id: buildIssueId('disconnected_subgraph', node.id),
          type: 'disconnected_subgraph',
          message: `Node "${node.data?.title || node.id}" is disconnected from the start node`,
          nodeId: node.id,
          severity: 'error',
        });
      }
    });
  }

  edges.forEach((edge) => {
    const edgeId = edge.id ?? buildFallbackEdgeId(edge);
    const hasSource = nodeIds.has(edge.source);
    const hasTarget = nodeIds.has(edge.target);

    if (!hasSource || !hasTarget) {
      const missingSide = !hasSource ? edge.source : edge.target;
      errors.push({
        id: buildIssueId('dangling_edge', edgeId),
        type: 'dangling_edge',
        message: `Edge is dangling because node "${missingSide}" is missing`,
        edgeId,
        nodeId: missingSide,
        severity: 'error',
      });
    }

    if (!edge.kind || !VALID_EDGE_KINDS.has(edge.kind)) {
      errors.push({
        id: buildIssueId('invalid_edge_kind', edgeId),
        type: 'invalid_edge_kind',
        message: `Edge has invalid kind "${edge.kind ?? 'unknown'}"`,
        edgeId,
        severity: 'error',
      });
    }
  });

  const acts = nodes.filter((node) => node.type === FORGE_NODE_TYPE.ACT);
  const chapters = nodes.filter((node) => node.type === FORGE_NODE_TYPE.CHAPTER);
  const pages = nodes.filter((node) => node.type === FORGE_NODE_TYPE.PAGE);

  chapters.forEach((chapter) => {
    const parentEdge = edges.find((edge) => edge.target === chapter.id);
    if (parentEdge) {
      const parent = nodes.find((node) => node.id === parentEdge.source);
      if (parent && parent.type !== FORGE_NODE_TYPE.ACT) {
        warnings.push({
          id: buildIssueId('invalid_hierarchy', chapter.id),
          type: 'invalid_hierarchy',
          message: `Chapter "${chapter.data?.title || chapter.id}" is not connected to an Act`,
          nodeId: chapter.id,
          severity: 'warning',
        });
      }
    }
  });

  pages.forEach((page) => {
    const parentEdge = edges.find((edge) => edge.target === page.id);
    if (parentEdge) {
      const parent = nodes.find((node) => node.id === parentEdge.source);
      if (parent && parent.type !== FORGE_NODE_TYPE.CHAPTER) {
        warnings.push({
          id: buildIssueId('invalid_hierarchy', page.id),
          type: 'invalid_hierarchy',
          message: `Page "${page.data?.title || page.id}" is not connected to a Chapter`,
          nodeId: page.id,
          severity: 'warning',
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function findLastNodeInHierarchy(graph: ForgeGraphDoc, pageType: PageType): string | null {
  const nodes = Object.values(graph.flow.nodes);

  const targetType =
    pageType === PAGE_TYPE.ACT
      ? null
      : pageType === PAGE_TYPE.CHAPTER
      ? FORGE_NODE_TYPE.ACT
      : FORGE_NODE_TYPE.CHAPTER;

  if (!targetType) {
    const acts = nodes.filter((node) => node.type === FORGE_NODE_TYPE.ACT);
    return acts[acts.length - 1]?.id || null;
  }

  const candidateNodes = nodes.filter((node) => node.type === targetType);

  if (candidateNodes.length === 0) {
    return null;
  }

  const nodesWithChildren = new Set(
    graph.flow.edges
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter((node) => node?.type === targetType)
      .map((node) => node!.id)
  );

  const leafNodes = candidateNodes.filter((node) => !nodesWithChildren.has(node.id));
  return leafNodes[leafNodes.length - 1]?.id || candidateNodes[candidateNodes.length - 1]?.id || null;
}

export function findNodeByPageId(graph: ForgeGraphDoc, pageId: number): string | null {
  const node = graph.flow.nodes.find((item) => item.data?.pageId === pageId);
  return node?.id || null;
}
