import { useCallback } from 'react';
import type { ForgeGraphDoc } from '@/shared/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/shared/types/forge-graph';
import type { ForgePage, PageType } from '@/shared/types/narrative';
import { PAGE_TYPE } from '@/shared/types/narrative';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@/writer/types/forge-data-adapter';
import { createFlowNode } from '@/shared/utils/forge-graph-helpers';
import { findLastNodeInHierarchy, findNodeByPageId } from '@/shared/lib/graph-validation';
import { useToast } from '@/shared/ui/toast';

export interface UseGraphPageSyncOptions {
  graph: ForgeGraphDoc | null;
  pages: ForgePage[];
  projectId: number | null;
  dataAdapter?: WriterDataAdapter;
  forgeDataAdapter?: WriterForgeDataAdapter;
  onGraphUpdate: (graph: ForgeGraphDoc) => void;
  onPagesUpdate: (pages: ForgePage[]) => void;
}

function pageTypeToNodeType(pageType: PageType): string {
  switch (pageType) {
    case PAGE_TYPE.ACT:
      return FORGE_NODE_TYPE.ACT;
    case PAGE_TYPE.CHAPTER:
      return FORGE_NODE_TYPE.CHAPTER;
    case PAGE_TYPE.PAGE:
      return FORGE_NODE_TYPE.PAGE;
    default:
      return FORGE_NODE_TYPE.PAGE;
  }
}

function calculatePosition(graph: ForgeGraphDoc | null, pageType: PageType): { x: number; y: number } {
  if (!graph) {
    return { x: 250, y: 100 };
  }
  
  const nodes = graph.flow.nodes; // nodes is already an array
  const nodeType = pageTypeToNodeType(pageType);
  const sameTypeNodes = nodes.filter(n => n.type === nodeType);
  
  // Base Y position by type
  const baseY = pageType === PAGE_TYPE.ACT ? 100 : pageType === PAGE_TYPE.CHAPTER ? 300 : 500;
  
  // Offset X for each new node of the same type
  const xOffset = sameTypeNodes.length * 300;
  
  return { x: 250 + xOffset, y: baseY };
}

export function useGraphPageSync({
  graph,
  pages,
  projectId,
  dataAdapter,
  forgeDataAdapter,
  onGraphUpdate,
  onPagesUpdate,
}: UseGraphPageSyncOptions) {
  const { toast } = useToast();
  
  // Create page + node + edge atomically
  const createPageWithNode = useCallback(async (input: {
    pageType: PageType;
    title: string;
    parentPageId?: number | null;
  }) => {
    if (!dataAdapter || !forgeDataAdapter || !graph || !projectId) {
      toast.error('Required adapters or graph not available');
      return null;
    }
    
    // Ensure pages is always an array
    const safePages = Array.isArray(pages) ? pages : [];
    
    try {
      // Calculate order based on siblings
      const siblings = safePages.filter(p => 
        p && p.pageType === input.pageType && p.parent === input.parentPageId
      );
      const order = siblings.length;
      
      // 1. Create page in DB
      const newPage = await dataAdapter.createPage({
        projectId,
        pageType: input.pageType,
        title: input.title,
        order,
        parent: input.parentPageId || null,
      });
      
      if (!newPage) {
        throw new Error('Failed to create page in database');
      }
      
      // 2. Create node in graph
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const position = calculatePosition(graph, input.pageType);
      const newNode = createFlowNode(
        pageTypeToNodeType(input.pageType) as any,
        nodeId,
        position.x,
        position.y
      );
      
      // Update node data with page info
      if (newNode.data) {
        newNode.data.pageId = newPage.id;
        newNode.data.title = newPage.title;
        newNode.data.label = newPage.title;
      }
      
      // 3. Find parent node to connect to
      const parentNodeId = input.parentPageId
        ? findNodeByPageId(graph, input.parentPageId)
        : findLastNodeInHierarchy(graph, input.pageType);
      
      // 4. Create edge if parent exists
      const newEdge = parentNodeId ? {
        id: `edge-${parentNodeId}-${newNode.id}-${Date.now()}`,
        source: parentNodeId,
        target: newNode.id,
      } : null;
      
      // 5. Update graph - nodes is an array, not an object
      // Ensure graph.flow.nodes is an array
      const currentNodes = Array.isArray(graph.flow.nodes) ? graph.flow.nodes : [];
      const currentEdges = Array.isArray(graph.flow.edges) ? graph.flow.edges : [];
      
      const updatedNodes = [...currentNodes, newNode];
      const updatedEdges = newEdge ? [...currentEdges, newEdge] : currentEdges;
      
      // 6. Update startNodeId and endNodeIds if this is the first node
      const isFirstNode = currentNodes.length === 0;
      const updateData: Parameters<typeof forgeDataAdapter.updateGraph>[1] = {
        flow: {
          nodes: updatedNodes,
          edges: updatedEdges,
          viewport: graph.flow.viewport || { x: 0, y: 0, zoom: 1 },
        },
      };
      
      if (isFirstNode) {
        // First node becomes both start and end
        updateData.startNodeId = newNode.id;
        updateData.endNodeIds = [{ nodeId: newNode.id }];
      } else if (input.pageType === PAGE_TYPE.ACT && !graph.startNodeId) {
        // If adding first Act to a graph that has no start, set it as start
        updateData.startNodeId = newNode.id;
      }
      
      // 7. Update graph first, then pages (atomic operation)
      const updatedGraph = await forgeDataAdapter.updateGraph(graph.id, updateData);
      
      // 8. Update state in correct order: graph first, then pages
      onGraphUpdate(updatedGraph);
      // Ensure we're updating with a proper array
      onPagesUpdate([...safePages, newPage]);
      
      toast.success(`Created ${input.pageType.toLowerCase()}: ${input.title}`);
      
      return { page: newPage, node: newNode };
    } catch (error) {
      console.error('Failed to create page with node:', error);
      toast.error(`Failed to create ${input.pageType.toLowerCase()}`);
      return null;
    }
  }, [graph, pages, projectId, dataAdapter, forgeDataAdapter, onGraphUpdate, onPagesUpdate, toast]);
  
  return { createPageWithNode };
}
