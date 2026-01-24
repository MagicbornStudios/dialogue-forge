// src/writer/lib/sync/narrative-graph-sync.ts
import type { ForgeGraphDoc, ForgeNode, ForgeReactFlowNode } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { ForgeDataAdapter } from '@/forge/adapters/forge-data-adapter';

export type NarrativeHierarchy = {
  // Connected hierarchy
  acts: Map<number, {
    act: ForgeAct;
    chapters: Map<number, {
      chapter: ForgeChapter;
      pages: Map<number, ForgePage>;
    }>;
  }>;
  
  // Disconnected items (no parent edges)
  disconnectedActs: ForgeAct[];
  disconnectedChapters: ForgeChapter[];
  disconnectedPages: ForgePage[];
  
  // Conditional access tracking
  conditionalPageConnections: Map<number, Set<string>>; // pageId -> conditional nodeIds
};

/**
 * Synchronous version that works with pre-loaded data
 * Use this when you already have pages loaded (unified Pages model)
 * Acts and chapters are now just pages with different types
 */
export function extractNarrativeHierarchySync(
  graph: ForgeGraphDoc | null,
  acts: ForgeAct[] | undefined,
  chapters: ForgeChapter[] | undefined,
  pages: ForgePage[] | undefined
): NarrativeHierarchy {
  // Handle null/undefined inputs safely
  if (!graph || !graph.flow || !Array.isArray(graph.flow.nodes)) {
    return {
      acts: new Map(),
      disconnectedActs: [],
      disconnectedChapters: [],
      disconnectedPages: Array.isArray(pages) ? pages : [],
      conditionalPageConnections: new Map(),
    };
  }

  const safeActs = Array.isArray(acts) ? acts : [];
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safePages = Array.isArray(pages) ? pages : [];

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
  
  // Build connected hierarchy
  const actsMap = new Map<number, {
    act: ForgeAct;
    chapters: Map<number, { chapter: ForgeChapter; pages: Map<number, ForgePage> }>;
  }>();
  
  for (const actId of connectedActIds) {
    const act = actMap.get(actId);
    if (!act) continue;
    
    const chaptersMap = new Map<number, { chapter: ForgeChapter; pages: Map<number, ForgePage> }>();
    
    // Find chapters for this act
    for (const chapter of safeChapters) {
      if (chapter.act === actId && connectedChapterIds.has(chapter.id)) {
        const pagesMap = new Map<number, ForgePage>();
        
        // Find pages for this chapter
        for (const page of safePages) {
          if (page.chapter === chapter.id && connectedPageIds.has(page.id)) {
            pagesMap.set(page.id, page);
          }
        }
        
        chaptersMap.set(chapter.id, { chapter, pages: pagesMap });
      }
    }
    
    actsMap.set(actId, { act, chapters: chaptersMap });
  }
  
  // Find disconnected items
  const disconnectedActsList = safeActs.filter(a => !connectedActIds.has(a.id));
  const disconnectedChaptersList = safeChapters.filter(c => !connectedChapterIds.has(c.id));
  const disconnectedPagesList = safePages.filter(p => !connectedPageIds.has(p.id));
  
  return {
    acts: actsMap,
    disconnectedActs: disconnectedActsList,
    disconnectedChapters: disconnectedChaptersList,
    disconnectedPages: disconnectedPagesList,
    conditionalPageConnections: findConditionalPageConnections(graph),
  };
}

/**
 * Extract narrative hierarchy from graph structure and database entries
 * This builds the hierarchy by matching graph nodes with database entries
 */
export async function extractNarrativeHierarchy(
  graph: ForgeGraphDoc,
  dataAdapter: WriterDataAdapter
): Promise<NarrativeHierarchy> {
  const nodeMap = new Map<string, ForgeReactFlowNode>(
    graph.flow.nodes.map(n => [n.id, n])
  );
  
  // Load all database entries
  const [allActs, allChapters, allPages] = await Promise.all([
    dataAdapter.listActs(graph.project),
    dataAdapter.listChapters(graph.project),
    dataAdapter.listPages(graph.project),
  ]);
  
  // Build maps for quick lookup
  const actMap = new Map(allActs.map(a => [a.id, a]));
  const chapterMap = new Map(allChapters.map(c => [c.id, c]));
  const pageMap = new Map(allPages.map(p => [p.id, p]));
  
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
  
  // Build connected hierarchy
  const acts = new Map<number, {
    act: ForgeAct;
    chapters: Map<number, { chapter: ForgeChapter; pages: Map<number, ForgePage> }>;
  }>();
  
  for (const actId of connectedActIds) {
    const act = actMap.get(actId);
    if (!act) continue;
    
    const chapters = new Map<number, { chapter: ForgeChapter; pages: Map<number, ForgePage> }>();
    
    // Find chapters for this act
    for (const chapter of allChapters) {
      if (chapter.act === actId && connectedChapterIds.has(chapter.id)) {
        const pages = new Map<number, ForgePage>();
        
        // Find pages for this chapter
        for (const page of allPages) {
          if (page.chapter === chapter.id && connectedPageIds.has(page.id)) {
            pages.set(page.id, page);
          }
        }
        
        chapters.set(chapter.id, { chapter, pages });
      }
    }
    
    acts.set(actId, { act, chapters });
  }
  
  // Find disconnected items
  const disconnectedActs = allActs.filter(a => !connectedActIds.has(a.id));
  const disconnectedChapters = allChapters.filter(c => !connectedChapterIds.has(c.id));
  const disconnectedPages = allPages.filter(p => !connectedPageIds.has(p.id));
  
  return {
    acts,
    disconnectedActs,
    disconnectedChapters,
    disconnectedPages,
    conditionalPageConnections: findConditionalPageConnections(graph),
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
  dataAdapter: WriterDataAdapter,
  forgeDataAdapter: ForgeDataAdapter
): Promise<void> {
  const projectId = graph.project;
  
  // Get existing acts, chapters, pages from database
  const [existingActs, existingChapters, existingPages] = await Promise.all([
    dataAdapter.listActs(projectId),
    dataAdapter.listChapters(projectId),
    dataAdapter.listPages(projectId),
  ]);
  
  const existingActIds = new Set(existingActs.map(a => a.id));
  const existingChapterIds = new Set(existingChapters.map(c => c.id));
  const existingPageIds = new Set(existingPages.map(p => p.id));
  
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
      } else {
        // Create new act in database
        const act = await forgeDataAdapter.createAct({
          projectId,
          name: nodeData?.label || 'New Act',
          summary: nodeData?.content || null,
          order: 0, // TODO: Calculate from graph position
        });
        // Note: We can't update the node here - that would require updating the graph
        // This will be handled by the Forge editor when nodes are created
      }
    } else if (nodeType === FORGE_NODE_TYPE.CHAPTER) {
      if (nodeData?.chapterId) {
        if (!existingChapterIds.has(nodeData.chapterId)) {
          console.warn(`Chapter node references non-existent chapter ID: ${nodeData.chapterId}`);
        }
      } else {
        // Find parent act from edges
        const parentActId = findParentActId(graph, node.id);
        if (parentActId) {
          // TODO: Create chapter - need to add createChapter to adapter
          console.warn('createChapter not yet implemented in adapters');
        }
      }
    } else if (nodeType === FORGE_NODE_TYPE.PAGE) {
      if (nodeData?.pageId) {
        if (!existingPageIds.has(nodeData.pageId)) {
          console.warn(`Page node references non-existent page ID: ${nodeData.pageId}`);
        }
      } else {
        // Find parent chapter from edges
        const parentChapterId = findParentChapterId(graph, node.id);
        if (parentChapterId && dataAdapter.createPage) {
          const page = await dataAdapter.createPage({
            title: nodeData?.label || 'New Page',
            project: projectId,
            chapter: parentChapterId,
            order: 0, // TODO: Calculate from graph position
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
