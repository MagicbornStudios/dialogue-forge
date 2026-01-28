import type { ForgeGraphDoc, ForgeReactFlowNode } from '@/shared/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/shared/types/forge-graph';
import type { ForgePage, PageType } from '@/shared/types/narrative';
import { PAGE_TYPE } from '@/shared/types/narrative';
import { findNodeByPageId } from '@/shared/lib/graph-validation';

/**
 * Find detour node connected to a narrative node (Act, Chapter, or Page)
 * Returns the detour node if one exists that is connected FROM the narrative node
 */
export function findDetourNodeForNarrativeNode(
  graph: ForgeGraphDoc,
  narrativeNodeId: string
): ForgeReactFlowNode | null {
  if (!graph || !narrativeNodeId) return null;
  
  // Find outgoing edges from the narrative node
  const outgoingEdges = graph.flow.edges.filter(e => e.source === narrativeNodeId);
  
  // Check if any outgoing edge goes to a detour node
  for (const edge of outgoingEdges) {
    const targetNode = graph.flow.nodes.find(n => n.id === edge.target);
    if (!targetNode) continue;
    
    // Check both node.type and node.data.type for compatibility
    const nodeType = targetNode.type || targetNode.data?.type;
    if (nodeType === FORGE_NODE_TYPE.DETOUR) {
      return targetNode;
    }
  }
  
  return null;
}

/**
 * Find the next adjacent narrative node in hierarchy
 * Returns the next Act, Chapter, or Page that should come after the given node
 * 
 * Adjacency rules:
 * - Adding Act after Act: adjacent
 * - Adding Chapter to Act: adjacent (first chapter)
 * - Adding Page to Chapter: adjacent (first page in that chapter)
 * - Adding Act when Chapter exists: not adjacent (should go to Chapter first)
 */
export function findNextAdjacentNarrativeNode(
  graph: ForgeGraphDoc,
  pages: ForgePage[],
  currentPageId: number
): { nodeId: string; pageId: number } | null {
  if (!graph || !pages || !currentPageId) return null;
  
  const currentPage = pages.find(p => p.id === currentPageId);
  if (!currentPage) return null;
  
  const currentNodeId = findNodeByPageId(graph, currentPageId);
  if (!currentNodeId) return null;
  
  // Find the next sibling or next element in hierarchy
  if (currentPage.pageType === PAGE_TYPE.ACT) {
    // Next Act: find next Act in pages array
    const allActs = pages.filter(p => p.pageType === PAGE_TYPE.ACT);
    const currentIndex = allActs.findIndex(p => p.id === currentPageId);
    if (currentIndex >= 0 && currentIndex < allActs.length - 1) {
      const nextAct = allActs[currentIndex + 1];
      const nextNodeId = findNodeByPageId(graph, nextAct.id);
      if (nextNodeId) {
        return { nodeId: nextNodeId, pageId: nextAct.id };
      }
    }
    
    // Or first Chapter in this Act
    const firstChapter = pages.find(p => p.parent === currentPageId && p.pageType === PAGE_TYPE.CHAPTER);
    if (firstChapter) {
      const chapterNodeId = findNodeByPageId(graph, firstChapter.id);
      if (chapterNodeId) {
        return { nodeId: chapterNodeId, pageId: firstChapter.id };
      }
    }
  } else if (currentPage.pageType === PAGE_TYPE.CHAPTER) {
    // Next Chapter in same Act, or first Page in this Chapter
    const siblings = pages.filter(p => p.parent === currentPage.parent && p.pageType === PAGE_TYPE.CHAPTER);
    const currentIndex = siblings.findIndex(p => p.id === currentPageId);
    
    if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
      const nextChapter = siblings[currentIndex + 1];
      const nextNodeId = findNodeByPageId(graph, nextChapter.id);
      if (nextNodeId) {
        return { nodeId: nextNodeId, pageId: nextChapter.id };
      }
    }
    
    // Or first Page in this Chapter
    const firstPage = pages.find(p => p.parent === currentPageId && p.pageType === PAGE_TYPE.PAGE);
    if (firstPage) {
      const pageNodeId = findNodeByPageId(graph, firstPage.id);
      if (pageNodeId) {
        return { nodeId: pageNodeId, pageId: firstPage.id };
      }
    }
  } else if (currentPage.pageType === PAGE_TYPE.PAGE) {
    // Next Page in same Chapter
    const siblings = pages.filter(p => p.parent === currentPage.parent && p.pageType === PAGE_TYPE.PAGE);
    const currentIndex = siblings.findIndex(p => p.id === currentPageId);
    
    if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
      const nextPage = siblings[currentIndex + 1];
      const nextNodeId = findNodeByPageId(graph, nextPage.id);
      if (nextNodeId) {
        return { nodeId: nextNodeId, pageId: nextPage.id };
      }
    }
  }
  
  return null;
}

/**
 * Check if a new element is adjacent to the parent element
 * Adjacent means it's the next logical element in the narrative flow
 */
export function isAdjacentNarrativeElement(
  parentPage: ForgePage | null,
  newPageType: PageType,
  pages: ForgePage[]
): boolean {
  if (!parentPage) {
    // Adding top-level Act is always adjacent
    return newPageType === PAGE_TYPE.ACT;
  }
  
  if (parentPage.pageType === PAGE_TYPE.ACT) {
    // Adding Chapter to Act: adjacent if it's the first chapter
    if (newPageType === PAGE_TYPE.CHAPTER) {
      const existingChapters = pages.filter(p => p.parent === parentPage.id && p.pageType === PAGE_TYPE.CHAPTER);
      return existingChapters.length === 0; // First chapter is adjacent
    }
    // Adding Act after Act: adjacent
    if (newPageType === PAGE_TYPE.ACT) {
      return true;
    }
  } else if (parentPage.pageType === PAGE_TYPE.CHAPTER) {
    // Adding Page to Chapter: adjacent if it's the first page
    if (newPageType === PAGE_TYPE.PAGE) {
      const existingPages = pages.filter(p => p.parent === parentPage.id && p.pageType === PAGE_TYPE.PAGE);
      return existingPages.length === 0; // First page is adjacent
    }
  }
  
  return false;
}

/**
 * Reconnect detour node to new target
 */
export function reconnectDetourNode(
  graph: ForgeGraphDoc,
  detourNodeId: string,
  newTargetNodeId: string
): ForgeGraphDoc {
  // Remove old edges from detour node
  const updatedEdges = graph.flow.edges.filter(
    e => !(e.source === detourNodeId && e.target !== newTargetNodeId)
  );
  
  // Add new edge if it doesn't exist
  const edgeExists = updatedEdges.some(e => e.source === detourNodeId && e.target === newTargetNodeId);
  if (!edgeExists) {
    updatedEdges.push({
      id: `edge-${detourNodeId}-${newTargetNodeId}-${Date.now()}`,
      source: detourNodeId,
      target: newTargetNodeId,
    });
  }
  
  return {
    ...graph,
    flow: {
      ...graph.flow,
      edges: updatedEdges,
    },
  };
}

/**
 * Handle insertion: reconnect detour and maintain flow
 * When inserting a new element between two existing elements where the previous element has a detour
 */
export function handleNarrativeInsertion(
  graph: ForgeGraphDoc,
  insertedNodeId: string,
  previousNodeId: string,
  nextNodeId: string | null
): ForgeGraphDoc {
  // Find detour node connected from previous node
  const detourNode = findDetourNodeForNarrativeNode(graph, previousNodeId);
  
  if (!detourNode || !nextNodeId) {
    // No detour to reconnect, or no next node
    return graph;
  }
  
  // Find edge from detour to next node
  const detourToNextEdge = graph.flow.edges.find(
    e => e.source === detourNode.id && e.target === nextNodeId
  );
  
  if (!detourToNextEdge) {
    // Detour doesn't point to next node, no reconnection needed
    return graph;
  }
  
  // Remove edge: detour → next node
  // Add edge: detour → inserted node
  // Add edge: inserted node → next node
  const updatedEdges = graph.flow.edges
    .filter(e => !(e.source === detourNode.id && e.target === nextNodeId))
    .concat([
      {
        id: `edge-${detourNode.id}-${insertedNodeId}-${Date.now()}`,
        source: detourNode.id,
        target: insertedNodeId,
      },
      {
        id: `edge-${insertedNodeId}-${nextNodeId}-${Date.now()}`,
        source: insertedNodeId,
        target: nextNodeId,
      },
    ]);
  
  return {
    ...graph,
    flow: {
      ...graph.flow,
      edges: updatedEdges,
    },
  };
}
