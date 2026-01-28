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
import {
  findDetourNodeForNarrativeNode,
  isAdjacentNarrativeElement,
  reconnectDetourNode,
  handleNarrativeInsertion,
} from '@/writer/lib/sync/narrative-connection-manager';

export interface UseGraphPageSyncOptions {
  graph: ForgeGraphDoc | null;
  pages: ForgePage[];
  projectId: number | null;
  dataAdapter?: WriterDataAdapter;
  forgeDataAdapter?: WriterForgeDataAdapter;
  onGraphUpdate?: (graph: ForgeGraphDoc) => void;
  onPagesUpdate: (pages: ForgePage[]) => void;
  // Optional draft system parameters (for future use)
  committedGraph?: ForgeGraphDoc | null;
  draftGraph?: ForgeGraphDoc | null;
  applyDelta?: (delta: any) => void;
  commitDraft?: () => void;
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
        // CRITICAL: Set type explicitly for graph-first traversal
        newNode.data.type = pageTypeToNodeType(input.pageType);
      }
      
      // 3. Find parent node to connect to
      const parentPage = input.parentPageId ? safePages.find(p => p.id === input.parentPageId) : null;
      const parentNodeId = input.parentPageId
        ? findNodeByPageId(effectiveGraph, input.parentPageId)
        : findLastNodeInHierarchy(effectiveGraph, input.pageType);
      
      // 4. Check if parent has detour node and if new element is adjacent
      // If detour exists and is adjacent, use detour connection ONLY (linear flow)
      // Otherwise, use normal parent connection
      let newEdge = null;
      let detourEdge = null;
      
      if (parentNodeId && parentPage) {
        const detourNode = findDetourNodeForNarrativeNode(effectiveGraph, parentNodeId);
        if (detourNode && isAdjacentNarrativeElement(parentPage, input.pageType, safePages)) {
          // Detour exists and new element is adjacent - use detour connection ONLY
          // Check what the detour is currently connected to (for debugging/logging)
          const currentEdges = Array.isArray(effectiveGraph.flow.edges) ? effectiveGraph.flow.edges : [];
          const detourOutgoingEdges = currentEdges.filter(e => e.source === detourNode.id);
          
          // Create edge from detour to new node
          detourEdge = {
            id: `edge-${detourNode.id}-${newNode.id}-${Date.now()}`,
            source: detourNode.id,
            target: newNode.id,
          };
          
          // Note: We're not removing old detour connections here - that's handled by the graph editor
          // The detour should only connect to the next adjacent element
          // If detour was previously connected to something else, the graph editor will handle cleanup
        } else {
          // No detour or not adjacent - use normal parent connection
          newEdge = {
            id: `edge-${parentNodeId}-${newNode.id}-${Date.now()}`,
            source: parentNodeId,
            target: newNode.id,
          };
        }
      } else if (parentNodeId) {
        // Parent exists but no parentPage (shouldn't happen, but handle gracefully)
        newEdge = {
          id: `edge-${parentNodeId}-${newNode.id}-${Date.now()}`,
          source: parentNodeId,
          target: newNode.id,
        };
      }
      
      // 6. Update graph - nodes is an array, not an object
      // Ensure graph.flow.nodes is an array
      const currentNodes = Array.isArray(effectiveGraph.flow.nodes) ? effectiveGraph.flow.nodes : [];
      const currentEdges = Array.isArray(effectiveGraph.flow.edges) ? effectiveGraph.flow.edges : [];
      
      const updatedNodes = [...currentNodes, newNode];
      const edgesToAdd = [newEdge, detourEdge].filter(Boolean) as typeof newEdge[];
      const updatedEdges = [...currentEdges, ...edgesToAdd];
      
      // 7. Update startNodeId and endNodeIds if this is the first node
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

      if (!forgeDataAdapter) {
        throw new Error('ForgeDataAdapter not available');
      }

      const persistedGraph = await forgeDataAdapter.updateGraph(updatedGraph.id, {
        flow: updatedGraph.flow,
        startNodeId: updatedGraph.startNodeId,
        endNodeIds: updatedGraph.endNodeIds,
      });

      // CRITICAL: Verify the node was created with correct pageId linkage
      const createdNode = persistedGraph.flow.nodes.find(n => n.id === newNode.id);
      if (!createdNode || createdNode.data?.pageId !== newPage.id) {
        console.error('[useGraphPageSync] Graph node not properly linked to page:', {
          nodeId: newNode.id,
          expectedPageId: newPage.id,
          actualPageId: createdNode?.data?.pageId,
        });
        throw new Error('Graph node not properly linked to page');
      }

      // Update graph first (triggers tree rebuild via graph-first approach)
      onGraphUpdate?.(persistedGraph);

      // Update pages for content/display (but tree structure comes from graph)
      const pageExists = safePages.some(p => p.id === newPage.id);
      if (!pageExists) {
        onPagesUpdate([...safePages, newPage]);
      }

      // Optional: Background refetch for consistency (non-blocking)
      if (dataAdapter && projectId) {
        dataAdapter.listPages(projectId).then(refreshedPages => {
          // Only update if we got more pages (might have been created elsewhere)
          if (refreshedPages.length > safePages.length + 1) {
            onPagesUpdate(refreshedPages);
          }
        }).catch(error => {
          console.error('[useGraphPageSync] Background refetch failed:', error);
        });
      }
      
      toast.success(`Created ${input.pageType.toLowerCase()}: ${input.title}`);
      
      return { page: newPage, node: newNode };
    } catch (error) {
      console.error('Failed to create page with node:', error);
      toast.error(`Failed to create ${input.pageType.toLowerCase()}`);
      return null;
    }
  }, [effectiveGraph, pages, projectId, dataAdapter, forgeDataAdapter, onGraphUpdate, onPagesUpdate, toast]);
  
  return { createPageWithNode };
}
