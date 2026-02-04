import { useCallback } from 'react';
import type { ForgeGraphDoc } from '@magicborn/shared/types/forge-graph';
import { FORGE_NODE_TYPE } from '@magicborn/shared/types/forge-graph';
import type { ForgePage, PageType } from '@magicborn/shared/types/narrative';
import { PAGE_TYPE } from '@magicborn/shared/types/narrative';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@magicborn/writer/types/forge-data-adapter';
import { createFlowNode } from '@magicborn/shared/utils/forge-graph-helpers';
import { findLastNodeInHierarchy, findNodeByPageId } from '@magicborn/shared/lib/graph-validation';
import { useToast } from '@magicborn/shared/ui/toast';
import { calculateDelta } from '@magicborn/shared/lib/draft/draft-helpers';

export interface UseGraphPageSyncOptions {
  graph: ForgeGraphDoc | null;
  committedGraph?: ForgeGraphDoc | null;
  draftGraph?: ForgeGraphDoc | null;
  applyDelta?: (delta: ReturnType<typeof calculateDelta>) => void;
  commitDraft?: () => Promise<void>;
  pages: ForgePage[];
  projectId: number | null;
  dataAdapter?: WriterDataAdapter;
  forgeDataAdapter?: WriterForgeDataAdapter;
  onGraphUpdate?: (graph: ForgeGraphDoc) => void;
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
  committedGraph,
  draftGraph,
  applyDelta,
  commitDraft,
  pages,
  projectId,
  dataAdapter,
  forgeDataAdapter,
  onGraphUpdate,
  onPagesUpdate,
}: UseGraphPageSyncOptions) {
  const { toast } = useToast();
  const effectiveGraph = draftGraph ?? graph;
  
  // Create page + node + edge atomically
  const createPageWithNode = useCallback(async (input: {
    pageType: PageType;
    title: string;
    parentPageId?: number | null;
  }) => {
    if (!dataAdapter || !effectiveGraph || !projectId) {
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
      const position = calculatePosition(effectiveGraph, input.pageType);
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
        ? findNodeByPageId(effectiveGraph, input.parentPageId)
        : findLastNodeInHierarchy(effectiveGraph, input.pageType);
      
      // 4. Create edge if parent exists
      const newEdge = parentNodeId ? {
        id: `edge-${parentNodeId}-${newNode.id}-${Date.now()}`,
        source: parentNodeId,
        target: newNode.id,
      } : null;
      
      // 5. Update graph - nodes is an array, not an object
      // Ensure graph.flow.nodes is an array
      const currentNodes = Array.isArray(effectiveGraph.flow.nodes) ? effectiveGraph.flow.nodes : [];
      const currentEdges = Array.isArray(effectiveGraph.flow.edges) ? effectiveGraph.flow.edges : [];
      
      const updatedNodes = [...currentNodes, newNode];
      const updatedEdges = newEdge ? [...currentEdges, newEdge] : currentEdges;
      
      // 6. Update startNodeId and endNodeIds if this is the first node
      const isFirstNode = currentNodes.length === 0;
      let updatedGraph: ForgeGraphDoc = {
        ...effectiveGraph,
        flow: {
          nodes: updatedNodes,
          edges: updatedEdges,
          viewport: effectiveGraph.flow.viewport || { x: 0, y: 0, zoom: 1 },
        },
      };
      
      if (isFirstNode) {
        // First node becomes both start and end
        updatedGraph.startNodeId = newNode.id;
        updatedGraph.endNodeIds = [{ nodeId: newNode.id }];
      } else if (input.pageType === PAGE_TYPE.ACT && !effectiveGraph.startNodeId) {
        // If adding first Act to a graph that has no start, set it as start
        updatedGraph.startNodeId = newNode.id;
      }

      const hasDraftPipeline = Boolean(applyDelta && commitDraft && (committedGraph ?? effectiveGraph));
      if (!hasDraftPipeline && !forgeDataAdapter) {
        throw new Error('ForgeDataAdapter not available');
      }

      if (hasDraftPipeline) {
        const committedGraphForDelta = committedGraph ?? effectiveGraph;
        if (!committedGraphForDelta) {
          throw new Error('Committed graph not available');
        }
        applyDelta?.(calculateDelta(committedGraphForDelta, updatedGraph));
        await commitDraft?.();
      } else if (forgeDataAdapter) {
        const persistedGraph = await forgeDataAdapter.updateGraph(updatedGraph.id, {
          flow: updatedGraph.flow,
          startNodeId: updatedGraph.startNodeId,
          endNodeIds: updatedGraph.endNodeIds,
        });
        onGraphUpdate?.(persistedGraph);
      }

      onPagesUpdate([...safePages, newPage]);
      
      toast.success(`Created ${input.pageType.toLowerCase()}: ${input.title}`);
      
      return { page: newPage, node: newNode };
    } catch (error) {
      console.error('Failed to create page with node:', error);
      toast.error(`Failed to create ${input.pageType.toLowerCase()}`);
      return null;
    }
  }, [applyDelta, commitDraft, committedGraph, effectiveGraph, pages, projectId, dataAdapter, forgeDataAdapter, onGraphUpdate, onPagesUpdate, toast]);
  
  return { createPageWithNode };
}
