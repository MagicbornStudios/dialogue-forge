// src/writer/lib/sync/narrative-graph-sync.ts
import type { ForgeGraphDoc, ForgeNode, ForgeReactFlowNode } from '@magicborn/shared/types/forge-graph';
import { FORGE_NODE_TYPE } from '@magicborn/shared/types/forge-graph';
import type { ForgePage, NarrativeHierarchy } from '@magicborn/shared/types/narrative';
import { PAGE_TYPE } from '@magicborn/shared/types/narrative';

export type NarrativePageApi = {
  listPages: (
    projectId: number,
    narrativeGraphId?: number | null
  ) => Promise<ForgePage[]>;
  createPage?: (input: {
    projectId: number;
    pageType: 'ACT' | 'CHAPTER' | 'PAGE';
    title: string;
    order: number;
    parent?: number | null;
    narrativeGraph?: number | null;
    bookBody?: string | null;
  }) => Promise<ForgePage>;
};

/**
 * Synchronous version that works with pre-loaded data
 * Use this when you already have pages loaded (unified Pages model)
 * Acts and chapters are now just pages with different types
 */
export function extractNarrativeHierarchySync(
  graph: ForgeGraphDoc | null,
  allPages: ForgePage[] | undefined
): NarrativeHierarchy {
  // Handle null/undefined inputs safely
  if (!graph || !graph.flow || !Array.isArray(graph.flow.nodes)) {
    return {
      acts: [],
    };
  }

  const safePages = Array.isArray(allPages) ? allPages : [];
  
  // Filter pages by type
  const safeActs = safePages.filter(p => p.pageType === PAGE_TYPE.ACT);
  const safeChapters = safePages.filter(p => p.pageType === PAGE_TYPE.CHAPTER);
  const safeContentPages = safePages.filter(p => p.pageType === PAGE_TYPE.PAGE);

  const nodeMap = new Map<string, ForgeReactFlowNode>(
    graph.flow.nodes.map(n => [n.id, n])
  );
  
  // Build maps for quick lookup
  const actMap = new Map(safeActs.map(a => [a.id, a]));
  const chapterMap = new Map(safeChapters.map(c => [c.id, c]));
  const pageMap = new Map(safePages.map(p => [p.id, p]));
  
  // Build edge maps
  const incomingEdges = new Map<string, string[]>(); // nodeId -> source nodeIds
  const outgoingEdges = new Map<string, string[]>(); // nodeId -> target nodeIds
  
  for (const edge of graph.flow.edges) {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge.source);
    
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge.target);
  }
  
  // Track which items are connected via graph edges
  const connectedActIds = new Set<number>();
  const connectedChapterIds = new Set<number>();
  const connectedPageIds = new Set<number>();
  
  // Build hierarchy by traversing from START node
  const startNodeId = graph.startNodeId;
  const visited = new Set<string>();
  
  if (startNodeId) {
    const queue: Array<{ nodeId: string; parentActId?: number; parentChapterId?: number }> = [
      { nodeId: startNodeId }
    ];
    
    while (queue.length > 0) {
      const { nodeId, parentActId, parentChapterId } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      
      const nodeData = node.data as ForgeNode | undefined;
      const nodeType = nodeData?.type ?? node.type;
      
      if (nodeType === FORGE_NODE_TYPE.ACT && nodeData?.actId) {
        connectedActIds.add(nodeData.actId);
        // Add children
        const targets = outgoingEdges.get(nodeId) ?? [];
        for (const targetId of targets) {
          queue.push({ nodeId: targetId, parentActId: nodeData.actId });
        }
      } else if (nodeType === FORGE_NODE_TYPE.CHAPTER && nodeData?.chapterId) {
        if (parentActId) {
          connectedChapterIds.add(nodeData.chapterId);
          // Add children
          const targets = outgoingEdges.get(nodeId) ?? [];
          for (const targetId of targets) {
            queue.push({ nodeId: targetId, parentActId, parentChapterId: nodeData.chapterId });
          }
        }
      } else if (nodeType === FORGE_NODE_TYPE.PAGE && nodeData?.pageId) {
        if (parentChapterId) {
          connectedPageIds.add(nodeData.pageId);
        }
        // Add children (pages can link to other pages/chapters/acts)
        const targets = outgoingEdges.get(nodeId) ?? [];
        for (const targetId of targets) {
          queue.push({ nodeId: targetId, parentActId, parentChapterId });
        }
      } else {
        // Other node types - continue traversal
        const targets = outgoingEdges.get(nodeId) ?? [];
        for (const targetId of targets) {
          queue.push({ nodeId: targetId, parentActId, parentChapterId });
        }
      }
    }
  }
  
  // Build connected hierarchy as array structure
  const actsArray: NarrativeHierarchy['acts'] = [];
  
  for (const actId of connectedActIds) {
    const act = actMap.get(actId);
    if (!act) continue;
    
    const chaptersArray: Array<{ page: ForgePage; pages: ForgePage[] }> = [];
    
    // Find chapters for this act (chapters have parent pointing to act page ID)
    for (const chapter of safeChapters) {
      if (chapter.parent === actId && connectedChapterIds.has(chapter.id)) {
        const pagesArray: ForgePage[] = [];
        
        // Find pages for this chapter (pages have parent pointing to chapter page ID)
        for (const page of safeContentPages) {
          if (page.parent === chapter.id && connectedPageIds.has(page.id)) {
            pagesArray.push(page);
          }
        }
        
        chaptersArray.push({ page: chapter, pages: pagesArray });
      }
    }
    
    actsArray.push({ page: act, chapters: chaptersArray });
  }
  
  return {
    acts: actsArray,
  };
}

/**
 * Extract narrative hierarchy from graph structure and database entries
 * This builds the hierarchy by matching graph nodes with database entries
 */
export async function extractNarrativeHierarchy(
  graph: ForgeGraphDoc,
  pageApi: NarrativePageApi
): Promise<NarrativeHierarchy> {
  const nodeMap = new Map<string, ForgeReactFlowNode>(
    graph.flow.nodes.map(n => [n.id, n])
  );
  
  // Load all pages (unified model - acts, chapters, and content pages are all pages)
  const allPages = await pageApi.listPages(graph.project);
  
  // Filter pages by type
  const allActs = allPages.filter(p => p.pageType === PAGE_TYPE.ACT);
  const allChapters = allPages.filter(p => p.pageType === PAGE_TYPE.CHAPTER);
  const allContentPages = allPages.filter(p => p.pageType === PAGE_TYPE.PAGE);
  
  // Build maps for quick lookup
  const actMap = new Map(allActs.map(a => [a.id, a]));
  const chapterMap = new Map(allChapters.map(c => [c.id, c]));
  const pageMap = new Map(allContentPages.map(p => [p.id, p]));
  
  // Build edge maps
  const incomingEdges = new Map<string, string[]>(); // nodeId -> source nodeIds
  const outgoingEdges = new Map<string, string[]>(); // nodeId -> target nodeIds
  
  for (const edge of graph.flow.edges) {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge.source);
    
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge.target);
  }
  
  // Map database IDs to node IDs
  const actIdToNodeId = new Map<number, string>();
  const chapterIdToNodeId = new Map<number, string>();
  const pageIdToNodeId = new Map<number, string>();
  
  for (const node of graph.flow.nodes) {
    const nodeData = node.data as ForgeNode | undefined;
    if (nodeData?.actId) actIdToNodeId.set(nodeData.actId, node.id);
    if (nodeData?.chapterId) chapterIdToNodeId.set(nodeData.chapterId, node.id);
    if (nodeData?.pageId) pageIdToNodeId.set(nodeData.pageId, node.id);
  }
  
  // Track which items are connected via graph edges
  const connectedActIds = new Set<number>();
  const connectedChapterIds = new Set<number>();
  const connectedPageIds = new Set<number>();
  
  // Build hierarchy by traversing from START node
  const startNodeId = graph.startNodeId;
  const visited = new Set<string>();
  
  if (startNodeId) {
    const queue: Array<{ nodeId: string; parentActId?: number; parentChapterId?: number }> = [
      { nodeId: startNodeId }
    ];
    
    while (queue.length > 0) {
      const { nodeId, parentActId, parentChapterId } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      
      const nodeData = node.data as ForgeNode | undefined;
      const nodeType = nodeData?.type ?? node.type;
      
      if (nodeType === FORGE_NODE_TYPE.ACT && nodeData?.actId) {
        connectedActIds.add(nodeData.actId);
        // Add children
        const targets = outgoingEdges.get(nodeId) ?? [];
        for (const targetId of targets) {
          queue.push({ nodeId: targetId, parentActId: nodeData.actId });
        }
      } else if (nodeType === FORGE_NODE_TYPE.CHAPTER && nodeData?.chapterId) {
        if (parentActId) {
          connectedChapterIds.add(nodeData.chapterId);
          // Add children
          const targets = outgoingEdges.get(nodeId) ?? [];
          for (const targetId of targets) {
            queue.push({ nodeId: targetId, parentActId, parentChapterId: nodeData.chapterId });
          }
        }
      } else if (nodeType === FORGE_NODE_TYPE.PAGE && nodeData?.pageId) {
        if (parentChapterId) {
          connectedPageIds.add(nodeData.pageId);
        }
        // Add children (pages can link to other pages/chapters/acts)
        const targets = outgoingEdges.get(nodeId) ?? [];
        for (const targetId of targets) {
          queue.push({ nodeId: targetId, parentActId, parentChapterId });
        }
      } else {
        // Other node types - continue traversal
        const targets = outgoingEdges.get(nodeId) ?? [];
        for (const targetId of targets) {
          queue.push({ nodeId: targetId, parentActId, parentChapterId });
        }
      }
    }
  }
  
  // Build connected hierarchy as array structure
  const actsArray: NarrativeHierarchy['acts'] = [];
  
  for (const actId of connectedActIds) {
    const act = actMap.get(actId);
    if (!act) continue;
    
    const chaptersArray: Array<{ page: ForgePage; pages: ForgePage[] }> = [];
    
    // Find chapters for this act (chapters have parent pointing to act page ID)
    for (const chapter of allChapters) {
      if (chapter.parent === actId && connectedChapterIds.has(chapter.id)) {
        const pagesArray: ForgePage[] = [];
        
        // Find pages for this chapter (pages have parent pointing to chapter page ID)
        for (const page of allContentPages) {
          if (page.parent === chapter.id && connectedPageIds.has(page.id)) {
            pagesArray.push(page);
          }
        }
        
        chaptersArray.push({ page: chapter, pages: pagesArray });
      }
    }
    
    actsArray.push({ page: act, chapters: chaptersArray });
  }
  
  return {
    acts: actsArray,
  };
}

/**
 * Find pages accessible via conditional nodes
 */
export function findConditionalPageConnections(graph: ForgeGraphDoc): Map<number, Set<string>> {
  const connections = new Map<number, Set<string>>();
  const nodeMap = new Map<string, ForgeReactFlowNode>(
    graph.flow.nodes.map(n => [n.id, n])
  );
  
  for (const node of graph.flow.nodes) {
    const nodeData = node.data as ForgeNode | undefined;
    if (nodeData?.type !== FORGE_NODE_TYPE.CONDITIONAL) {
      continue;
    }
    
    // Check all conditional blocks
    for (const block of nodeData.conditionalBlocks ?? []) {
      if (block.nextNodeId) {
        // Follow the chain to find PAGE nodes
        const visited = new Set<string>();
        const queue: string[] = [block.nextNodeId];
        
        while (queue.length > 0) {
          const nextId = queue.shift()!;
          if (visited.has(nextId)) continue;
          visited.add(nextId);
          
          const targetNode = nodeMap.get(nextId);
          if (!targetNode) continue;
          
          const targetData = targetNode.data as ForgeNode | undefined;
          const targetType = targetData?.type ?? targetNode.type;
          
          if (targetType === FORGE_NODE_TYPE.PAGE && targetData?.pageId) {
            const pageId = targetData.pageId;
            if (!connections.has(pageId)) {
              connections.set(pageId, new Set());
            }
            connections.get(pageId)!.add(node.id);
          } else {
            // Continue following edges
            const targets = graph.flow.edges
              .filter(e => e.source === nextId)
              .map(e => e.target);
            queue.push(...targets);
          }
        }
      }
    }
  }
  
  return connections;
}

/**
 * Sync graph nodes to database - create database entries for nodes that don't have them
 * This is a simplified version - full implementation would need to handle updates too
 */
export async function syncGraphToDatabase(
  graph: ForgeGraphDoc,
  pageApi: NarrativePageApi
): Promise<void> {
  const projectId = graph.project;
  
  // Get existing pages from database (unified model)
  const allPages = await pageApi.listPages(projectId);
  
  // Filter by type
  const existingActs = allPages.filter(p => p.pageType === PAGE_TYPE.ACT);
  const existingChapters = allPages.filter(p => p.pageType === PAGE_TYPE.CHAPTER);
  const existingContentPages = allPages.filter(p => p.pageType === PAGE_TYPE.PAGE);
  
  const existingActIds = new Set(existingActs.map(a => a.id));
  const existingChapterIds = new Set(existingChapters.map(c => c.id));
  const existingPageIds = new Set(existingContentPages.map(p => p.id));
  
  // Process nodes and create missing database entries
  for (const node of graph.flow.nodes) {
    const nodeData = node.data as ForgeNode | undefined;
    const nodeType = nodeData?.type ?? node.type;
    
    if (nodeType === FORGE_NODE_TYPE.ACT) {
      if (nodeData?.actId) {
        // Node already has database entry
        if (!existingActIds.has(nodeData.actId)) {
          // Database entry doesn't exist - this is an error state
          console.warn(`Act node references non-existent act ID: ${nodeData.actId}`);
        }
      } else if (pageApi.createPage) {
        // Create new act page in database (unified model)
        await pageApi.createPage({
          projectId,
          pageType: PAGE_TYPE.ACT,
          title: nodeData?.label || 'New Act',
          order: 0, // TODO: Calculate from graph position
          parent: null, // Acts have no parent
        });
        // Note: We can't update the node here - that would require updating the graph
        // This will be handled by the Forge editor when nodes are created
      }
    } else if (nodeType === FORGE_NODE_TYPE.CHAPTER) {
      if (nodeData?.chapterId) {
        if (!existingChapterIds.has(nodeData.chapterId)) {
          console.warn(`Chapter node references non-existent chapter ID: ${nodeData.chapterId}`);
        }
      } else if (pageApi.createPage) {
        // Find parent act from edges
        const parentActId = findParentActId(graph, node.id);
        if (parentActId) {
          // Create chapter page in database (unified model)
          await pageApi.createPage({
            projectId,
            pageType: PAGE_TYPE.CHAPTER,
            title: nodeData?.label || 'New Chapter',
            order: 0, // TODO: Calculate from graph position
            parent: parentActId, // Chapter's parent is the act page
          });
        }
      }
    } else if (nodeType === FORGE_NODE_TYPE.PAGE) {
      if (nodeData?.pageId) {
        if (!existingPageIds.has(nodeData.pageId)) {
          console.warn(`Page node references non-existent page ID: ${nodeData.pageId}`);
        }
      } else if (pageApi.createPage) {
        // Find parent chapter from edges
        const parentChapterId = findParentChapterId(graph, node.id);
        if (parentChapterId) {
          const page = await pageApi.createPage({
            projectId,
            pageType: PAGE_TYPE.PAGE,
            title: nodeData?.label || 'New Page',
            order: 0, // TODO: Calculate from graph position
            parent: parentChapterId, // Page's parent is the chapter page
            bookBody: nodeData?.content || null,
          });
          // Note: Can't update node here - handled by Forge editor
        }
      }
    }
  }
}

/**
 * Helper to find parent act ID for a node by following edges backwards
 */
function findParentActId(graph: ForgeGraphDoc, nodeId: string): number | null {
  const nodeMap = new Map<string, ForgeReactFlowNode>(
    graph.flow.nodes.map(n => [n.id, n])
  );
  
  const visited = new Set<string>();
  const queue: string[] = [nodeId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    // Find incoming edges
    const sources = graph.flow.edges
      .filter(e => e.target === currentId)
      .map(e => e.source);
    
    for (const sourceId of sources) {
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) continue;
      
      const sourceData = sourceNode.data as ForgeNode | undefined;
      const sourceType = sourceData?.type ?? sourceNode.type;
      
      if (sourceType === FORGE_NODE_TYPE.ACT && sourceData?.actId) {
        return sourceData.actId;
      }
      
      // Continue searching backwards
      queue.push(sourceId);
    }
  }
  
  return null;
}

/**
 * Helper to find parent chapter ID for a node by following edges backwards
 */
function findParentChapterId(graph: ForgeGraphDoc, nodeId: string): number | null {
  const nodeMap = new Map<string, ForgeReactFlowNode>(
    graph.flow.nodes.map(n => [n.id, n])
  );
  
  const visited = new Set<string>();
  const queue: string[] = [nodeId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    // Find incoming edges
    const sources = graph.flow.edges
      .filter(e => e.target === currentId)
      .map(e => e.source);
    
    for (const sourceId of sources) {
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) continue;
      
      const sourceData = sourceNode.data as ForgeNode | undefined;
      const sourceType = sourceData?.type ?? sourceNode.type;
      
      if (sourceType === FORGE_NODE_TYPE.CHAPTER && sourceData?.chapterId) {
        return sourceData.chapterId;
      }
      
      // Continue searching backwards
      queue.push(sourceId);
    }
  }
  
  return null;
}
