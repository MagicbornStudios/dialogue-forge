import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { PAGE_TYPE, type PageType } from '@/forge/types/narrative';

export type GraphValidationError = {
  type: 'orphaned_node' | 'missing_start' | 'disconnected_subgraph' | 'invalid_hierarchy';
  message: string;
  nodeIds?: string[];
  severity: 'error' | 'warning';
};

export type GraphValidationResult = {
  valid: boolean;
  errors: GraphValidationError[];
  warnings: GraphValidationError[];
};

export function validateNarrativeGraph(graph: ForgeGraphDoc): GraphValidationResult {
  const errors: GraphValidationError[] = [];
  const warnings: GraphValidationError[] = [];
  
  // Check 1: Must have at least one node or be explicitly empty
  const nodes = graph.flow.nodes; // nodes is already an array
  const nodeCount = nodes.length;
  
  if (nodeCount === 0) {
    return { valid: true, errors: [], warnings: [] }; // Empty is valid
  }
  
  // Check 2: All nodes except start must have incoming edges (no orphans)
  if (nodeCount > 1) {
    const nodesWithIncoming = new Set(graph.flow.edges.map(e => e.target));
    const orphanedNodes = nodes
      .filter(node => !nodesWithIncoming.has(node.id) && node.id !== graph.startNodeId)
      .map(n => n.id);
    
    if (orphanedNodes.length > 0) {
      errors.push({
        type: 'orphaned_node',
        message: `Found ${orphanedNodes.length} disconnected node(s)`,
        nodeIds: orphanedNodes,
        severity: 'error',
      });
    }
  }
  
  // Check 3: Validate hierarchy (Acts → Chapters → Pages)
  const acts = nodes.filter(n => n.type === FORGE_NODE_TYPE.ACT);
  const chapters = nodes.filter(n => n.type === FORGE_NODE_TYPE.CHAPTER);
  const pages = nodes.filter(n => n.type === FORGE_NODE_TYPE.PAGE);
  
  // Chapters should connect from Acts
  chapters.forEach(chapter => {
    const parentEdge = graph.flow.edges.find(e => e.target === chapter.id);
    if (parentEdge) {
      const parent = nodes.find(n => n.id === parentEdge.source);
      if (parent && parent.type !== FORGE_NODE_TYPE.ACT) {
        warnings.push({
          type: 'invalid_hierarchy',
          message: `Chapter "${chapter.data?.title || chapter.id}" is not connected to an Act`,
          nodeIds: [chapter.id],
          severity: 'warning',
        });
      }
    }
  });
  
  // Pages should connect from Chapters
  pages.forEach(page => {
    const parentEdge = graph.flow.edges.find(e => e.target === page.id);
    if (parentEdge) {
      const parent = nodes.find(n => n.id === parentEdge.source);
      if (parent && parent.type !== FORGE_NODE_TYPE.CHAPTER) {
        warnings.push({
          type: 'invalid_hierarchy',
          message: `Page "${page.data?.title || page.id}" is not connected to a Chapter`,
          nodeIds: [page.id],
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
  
  // Find the deepest/last node to connect new nodes to
  const targetType = pageType === PAGE_TYPE.ACT 
    ? null // New act connects to previous act or nothing
    : pageType === PAGE_TYPE.CHAPTER
    ? FORGE_NODE_TYPE.ACT // Chapters connect to acts
    : FORGE_NODE_TYPE.CHAPTER; // Pages connect to chapters
  
  if (!targetType) {
    // For acts, find the last act node
    const acts = nodes.filter(n => n.type === FORGE_NODE_TYPE.ACT);
    return acts[acts.length - 1]?.id || null;
  }
  
  const candidateNodes = nodes.filter(n => n.type === targetType);
  
  if (candidateNodes.length === 0) {
    return null;
  }
  
  // Find nodes with no outgoing edges of the target type
  const nodesWithChildren = new Set(
    graph.flow.edges
      .map(e => nodes.find(n => n.id === e.source))
      .filter(n => n?.type === targetType)
      .map(n => n!.id)
  );
  
  const leafNodes = candidateNodes.filter(n => !nodesWithChildren.has(n.id));
  return leafNodes[leafNodes.length - 1]?.id || candidateNodes[candidateNodes.length - 1]?.id || null;
}

export function findNodeByPageId(graph: ForgeGraphDoc, pageId: number): string | null {
  const node = graph.flow.nodes.find(n => n.data?.pageId === pageId);
  return node?.id || null;
}
