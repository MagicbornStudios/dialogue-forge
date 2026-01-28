'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { BookOpen, FileText, File, Plus } from 'lucide-react';
import { Tree } from 'react-arborist';
import { WriterTreeRow } from './WriterTreeRow';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { PAGE_TYPE, buildNarrativeHierarchy, type ForgePage, type PageType } from '@/shared/types/narrative';
import { useGraphPageSync } from '@/writer/hooks/use-graph-page-sync';
import { useToast } from '@/shared/ui/toast';
import { validateNarrativeGraph } from '@/shared/lib/graph-validation';
import type { ForgeGraphDoc } from '@/shared/types/forge-graph';
import { FORGE_NODE_TYPE, type ForgeNodeType } from '@/shared/types/forge-graph';

interface WriterTreeProps {
  className?: string;
  projectId?: number | null;
}

type TreeNode = {
  id: string;
  name: string;
  page: ForgePage;
  children?: TreeNode[];
  hasDetour?: boolean;
  hasConditional?: boolean;
  isEndNode?: boolean;
};

function getIconForPageType(pageType: string) {
  switch (pageType) {
    case PAGE_TYPE.ACT:
      return <BookOpen size={14} />;
    case PAGE_TYPE.CHAPTER:
      return <FileText size={14} />;
    case PAGE_TYPE.PAGE:
      return <File size={14} />;
    default:
      return <File size={14} />;
  }
}

/**
 * Check if a node has outgoing edges to DETOUR nodes
 * Also checks for incoming edges FROM detour nodes (detour connected to this node)
 */
function hasDetourConnection(graph: ForgeGraphDoc | null, nodeId: string | null): boolean {
  if (!graph || !nodeId) return false;
  
  const node = graph.flow.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  
  // Check outgoing edges TO detour nodes
  const outgoingEdges = graph.flow.edges.filter(e => e.source === nodeId);
  const hasOutgoingToDetour = outgoingEdges.some(edge => {
    const targetNode = graph.flow.nodes.find(n => n.id === edge.target);
    if (!targetNode) return false;
    // Check both node.type and node.data.type for compatibility
    const nodeType = targetNode.type || targetNode.data?.type;
    return nodeType === FORGE_NODE_TYPE.DETOUR;
  });
  
  // Check incoming edges FROM detour nodes (detour connected to this node)
  const incomingEdges = graph.flow.edges.filter(e => e.target === nodeId);
  const hasIncomingFromDetour = incomingEdges.some(edge => {
    const sourceNode = graph.flow.nodes.find(n => n.id === edge.source);
    if (!sourceNode) return false;
    // Check both node.type and node.data.type for compatibility
    const nodeType = sourceNode.type || sourceNode.data?.type;
    return nodeType === FORGE_NODE_TYPE.DETOUR;
  });
  
  return hasOutgoingToDetour || hasIncomingFromDetour;
}

/**
 * Check if a node has outgoing edges to CONDITIONAL nodes
 */
function hasConditionalConnection(graph: ForgeGraphDoc | null, nodeId: string | null): boolean {
  if (!graph || !nodeId) return false;
  
  const node = graph.flow.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  
  // Check if node has outgoing edges to CONDITIONAL nodes
  const outgoingEdges = graph.flow.edges.filter(e => e.source === nodeId);
  return outgoingEdges.some(edge => {
    const targetNode = graph.flow.nodes.find(n => n.id === edge.target);
    if (!targetNode) return false;
    // Check both node.type and node.data.type for compatibility
    const nodeType = targetNode.type || targetNode.data?.type;
    return nodeType === FORGE_NODE_TYPE.CONDITIONAL;
  });
}

/**
 * Check if a node has no outgoing edges (is an end node)
 */
function isEndNode(graph: ForgeGraphDoc | null, nodeId: string | null): boolean {
  if (!graph || !nodeId) return false;
  
  const hasOutgoing = graph.flow.edges.some(e => e.source === nodeId);
  return !hasOutgoing;
}

/**
 * Find the graph node ID for a given page ID
 * CRITICAL: Only returns nodes that are ACT, CHAPTER, or PAGE types
 * Detour and Conditional nodes are explicitly excluded
 */
function findNodeIdByPageId(graph: ForgeGraphDoc | null, pageId: number): string | null {
  if (!graph) return null;
  const node = graph.flow.nodes.find(n => n.data?.pageId === pageId);
  if (!node) return null;
  
  // CRITICAL: Validate node type - only return ACT, CHAPTER, or PAGE nodes
  const nodeType = node.type || node.data?.type;
  if (nodeType !== FORGE_NODE_TYPE.ACT && 
      nodeType !== FORGE_NODE_TYPE.CHAPTER && 
      nodeType !== FORGE_NODE_TYPE.PAGE) {
    // This is a detour/conditional node - don't return it
    console.warn(`[WriterTree] Node with pageId ${pageId} is not a narrative node (type: ${nodeType}). Ignoring.`);
    return null;
  }
  
  return node.id;
}

// Helper to get all node IDs recursively for initial expansion
function getAllNodeIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids.push(...getAllNodeIds(node.children));
    }
  }
  return ids;
}

/**
 * Build tree data from graph traversal (GRAPH-FIRST approach)
 * Traverses the graph linearly from startNodeId, following edges
 */
function buildTreeDataFromGraph(
  graph: ForgeGraphDoc | null,
  pagesMap: Map<number, ForgePage>,
  drafts: Record<number, { title: string }>
): TreeNode[] {
  if (!graph || !graph.startNodeId) {
    return [];
  }

  const nodeMap = new Map(graph.flow.nodes.map(n => [n.id, n]));
  const outgoingEdges = new Map<string, string[]>();
  for (const edge of graph.flow.edges) {
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge.target);
  }

  const visited = new Set<string>();
  const treeNodes: TreeNode[] = [];
  let currentAct: TreeNode | null = null;
  let currentChapter: TreeNode | null = null;

  function getDisplayTitle(page: ForgePage): string {
    const draftTitle = drafts[page.id]?.title?.trim();
    return draftTitle || page.title;
  }

  function traverseNode(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const nodeType = node.type || node.data?.type;
    const nodeData = node.data as any;

    // Skip non-narrative nodes (they exist on graph but not in tree)
    if (nodeType === FORGE_NODE_TYPE.DETOUR || 
        nodeType === FORGE_NODE_TYPE.CONDITIONAL) {
      // Continue traversal but don't add to tree
      const targets = outgoingEdges.get(nodeId) || [];
      for (const targetId of targets) {
        traverseNode(targetId);
      }
      return;
    }

    // Handle ACT nodes
    if (nodeType === FORGE_NODE_TYPE.ACT && nodeData?.pageId) {
      const page = pagesMap.get(nodeData.pageId);
      if (page) {
        currentAct = {
          id: `page-${page.id}`,
          name: getDisplayTitle(page),
          page,
          hasDetour: hasDetourConnection(graph, nodeId),
          hasConditional: hasConditionalConnection(graph, nodeId),
          isEndNode: isEndNode(graph, nodeId),
          children: [],
        };
        treeNodes.push(currentAct);
        currentChapter = null; // Reset chapter when new act starts
      }
    }
    // Handle CHAPTER nodes
    else if (nodeType === FORGE_NODE_TYPE.CHAPTER && nodeData?.pageId) {
      const page = pagesMap.get(nodeData.pageId);
      if (page && currentAct && currentAct.children) {
        currentChapter = {
          id: `page-${page.id}`,
          name: getDisplayTitle(page),
          page,
          hasDetour: hasDetourConnection(graph, nodeId),
          hasConditional: hasConditionalConnection(graph, nodeId),
          isEndNode: isEndNode(graph, nodeId),
          children: [],
        };
        currentAct.children.push(currentChapter);
      }
    }
    // Handle PAGE nodes
    else if (nodeType === FORGE_NODE_TYPE.PAGE && nodeData?.pageId) {
      const page = pagesMap.get(nodeData.pageId);
      if (page && currentChapter) {
        // Ensure children array exists
        if (!currentChapter.children) {
          currentChapter.children = [];
        }
        const pageNode: TreeNode = {
          id: `page-${page.id}`,
          name: getDisplayTitle(page),
          page,
          hasDetour: hasDetourConnection(graph, nodeId),
          hasConditional: hasConditionalConnection(graph, nodeId),
          isEndNode: isEndNode(graph, nodeId),
        };
        currentChapter.children.push(pageNode);
      }
    }

    // Continue traversal to next nodes
    const targets = outgoingEdges.get(nodeId) || [];
    for (const targetId of targets) {
      traverseNode(targetId);
    }
  }

  // Start traversal from startNodeId
  traverseNode(graph.startNodeId);

  return treeNodes;
}

/**
 * Build tree data from graph (GRAPH-FIRST approach)
 * Graph is the source of truth for structure and order
 */
function buildTreeData(
  pages: ForgePage[], 
  graph: ForgeGraphDoc | null,
  drafts: Record<number, { title: string }>
): TreeNode[] {
  if (!graph || !graph.startNodeId) {
    return [];
  }

  // Build pages map for quick lookup by pageId
  const pagesMap = new Map<number, ForgePage>();
  for (const page of pages || []) {
    if (page && (page.pageType === PAGE_TYPE.ACT || 
                 page.pageType === PAGE_TYPE.CHAPTER || 
                 page.pageType === PAGE_TYPE.PAGE)) {
      pagesMap.set(page.id, page);
    }
  }

  // Build tree from graph traversal
  return buildTreeDataFromGraph(graph, pagesMap, drafts);
}

export function WriterTree({ className, projectId: projectIdProp }: WriterTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [treeHeight, setTreeHeight] = useState(400);
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get store values - use separate selectors to ensure updates are detected
  // Using useShallow would require accessing the store directly, so we use separate selectors
  // which will trigger re-renders when any of these values change
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const narrativeGraph = useWriterWorkspaceStore((state) => state.narrativeGraph);
  const drafts = useWriterWorkspaceStore((state) => state.drafts);
  
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
  const forgeDataAdapter = useWriterWorkspaceStore((state) => state.forgeDataAdapter);
  const narrativeGraphs = useWriterWorkspaceStore((state) => state.narrativeGraphs);
  const selectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.selectedNarrativeGraphId);
  
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const setPages = useWriterWorkspaceStore((state) => state.actions.setPages);
  const setNarrativeGraph = useWriterWorkspaceStore((state) => state.actions.setNarrativeGraph);
  const setSelectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.actions.setSelectedNarrativeGraphId);
  const createNarrativeGraph = useWriterWorkspaceStore((state) => state.actions.createNarrativeGraph);

  const effectiveGraph = narrativeGraph;

  const projectId = projectIdProp ?? pages[0]?.project ?? null;

  // Graph-page sync hook
  const { createPageWithNode } = useGraphPageSync({
    graph: narrativeGraph,
    pages,
    projectId,
    dataAdapter,
    forgeDataAdapter,
    onGraphUpdate: setNarrativeGraph,
    onPagesUpdate: setPages,
  });

  // Build tree data from graph (GRAPH-FIRST approach)
  // Graph is the source of truth, so memo primarily depends on graph changes
  const treeNodes = useMemo(
    () => {
      console.log('[WriterTree] Recalculating treeNodes from graph:', {
        graphId: narrativeGraph?.id,
        startNodeId: narrativeGraph?.startNodeId,
        nodesCount: narrativeGraph?.flow.nodes.length || 0,
        pagesCount: pages?.length || 0,
      });
      return buildTreeData(pages || [], narrativeGraph, drafts);
    }, 
    [narrativeGraph, narrativeGraph?.startNodeId, narrativeGraph?.flow.nodes.length, pages, drafts]
  );
  
  // Debug logging to track when tree updates
  useEffect(() => {
    console.log('[WriterTree] Tree data updated:', {
      pagesCount: pages?.length || 0,
      graphId: narrativeGraph?.id,
      startNodeId: narrativeGraph?.startNodeId,
      nodesCount: narrativeGraph?.flow.nodes.length || 0,
      treeNodesCount: treeNodes.length,
      validPages: pages?.filter(p => 
        p && (p.pageType === PAGE_TYPE.ACT || p.pageType === PAGE_TYPE.CHAPTER || p.pageType === PAGE_TYPE.PAGE)
      ).length || 0,
    });
  }, [pages, narrativeGraph, treeNodes]);
  
  // Convert to react-arborist format
  const treeData = useMemo(() => {
    const convertNode = (node: TreeNode): any => ({
      id: node.id,
      name: node.name,
      page: node.page,
      hasDetour: node.hasDetour,
      hasConditional: node.hasConditional,
      isEndNode: node.isEndNode,
      children: node.children?.map(convertNode) || [],
    });
    return treeNodes.map(convertNode);
  }, [treeNodes]);
  
  // Find the node ID for the active page
  const selectedNodeId: string | undefined = useMemo(() => {
    if (!activePageId) return undefined;
    const findNodeId = (nodes: TreeNode[]): string | undefined => {
      for (const node of nodes) {
        if (node.page.id === activePageId) {
          return node.id;
        }
        if (node.children) {
          const found = findNodeId(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findNodeId(treeNodes);
  }, [activePageId, treeNodes]);
  
  // Track tree height dynamically - update when container size changes
  useEffect(() => {
    const updateHeight = () => {
      if (treeContainerRef.current) {
        const height = treeContainerRef.current.clientHeight;
        if (height > 0) {
          setTreeHeight(height);
        }
      }
    };
    
    // Initial update
    updateHeight();
    
    // Use ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    if (treeContainerRef.current) {
      resizeObserver.observe(treeContainerRef.current);
    }
    
    // Fallback to window resize
    window.addEventListener('resize', updateHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [treeData.length]); // Re-run when tree data changes

  // Validate graph on load
  React.useEffect(() => {
    if (effectiveGraph && pages.length > 0) {
      const validation = validateNarrativeGraph(effectiveGraph);
      
      if (!validation.valid) {
        validation.errors.forEach(error => {
          toast.error(error.message);
        });
      }
      
      validation.warnings.forEach(warning => {
        toast.warning(warning.message);
      });
    }
  }, [effectiveGraph, pages.length, toast]);

  // Handle creating first Act when empty
  const handleCreateFirstAct = useCallback(async () => {
    if (!projectId || !dataAdapter || isCreating) return;

    try {
      setIsCreating(true);

      // Get or create narrative graph
      let graph = effectiveGraph;
      if (!graph) {
        graph = await createNarrativeGraph(projectId);
      }

      if (!graph) {
        throw new Error('Failed to create narrative graph');
      }

      // Use sync hook to create Act with node
      await createPageWithNode({
        pageType: PAGE_TYPE.ACT,
        title: 'Act I',
        parentPageId: null,
      });
    } catch (error) {
      console.error('[WriterTree] Failed to create first act:', error);
      toast.error('Failed to create first act');
    } finally {
      setIsCreating(false);
    }
  }, [projectId, dataAdapter, isCreating, effectiveGraph, createNarrativeGraph, createPageWithNode, toast]);

  // Handle adding child page
  const handleAddChild = useCallback(async (parentPage: ForgePage | null, pageType?: PageType) => {
    if (isCreating || !projectId || !dataAdapter) return;

    try {
      setIsCreating(true);

      // Ensure we have a narrative graph
      let graph = effectiveGraph;
      if (!graph) {
        graph = await createNarrativeGraph(projectId);
        if (graph) {
          setNarrativeGraph(graph);
        }
      }

      if (!graph) {
        toast.error('Failed to create or load narrative graph');
        return;
      }

      // If no parent, we're adding a top-level Act
      if (!parentPage) {
        const actCount = pages.filter(p => p.pageType === PAGE_TYPE.ACT).length;
        const result = await createPageWithNode({
          pageType: PAGE_TYPE.ACT,
          title: `Act ${actCount + 1}`,
          parentPageId: null,
        });
        return;
      }

      // Determine child type from parent or explicit type
      const childType = pageType || (parentPage.pageType === PAGE_TYPE.ACT 
        ? PAGE_TYPE.CHAPTER 
        : PAGE_TYPE.PAGE);
      
      const childCount = pages.filter(p => 
        p.pageType === childType && p.parent === parentPage.id
      ).length;
      
      const title = childType === PAGE_TYPE.CHAPTER 
        ? `Chapter ${childCount + 1}`
        : `Page ${childCount + 1}`;

      const result = await createPageWithNode({
        pageType: childType,
        title,
        parentPageId: parentPage.id,
      });

      if (result && result.page.pageType === PAGE_TYPE.PAGE) {
        setActivePageId(result.page.id);
      }
    } catch (error) {
      console.error('[WriterTree] Failed to add child:', error);
      toast.error('Failed to add page');
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, projectId, dataAdapter, pages, effectiveGraph, createNarrativeGraph, createPageWithNode, setActivePageId, setNarrativeGraph, toast]);


  // Handle page deletion
  const handleDeletePage = useCallback(async (page: ForgePage) => {
    // Check if page has children
    const hasChildren = pages.some(p => p.parent === page.id);
    
    if (hasChildren) {
      toast.warning('Cannot delete page with children. Delete children first.');
      return;
    }
    
    // Check if page has a corresponding node in the narrative graph
    if (effectiveGraph) {
      const correspondingNode = effectiveGraph.flow.nodes.find(
        n => (n.data as any)?.pageId === page.id
      );
      
      if (correspondingNode) {
        const nodeType = (correspondingNode.type as ForgeNodeType | undefined) ?? 
                        ((correspondingNode.data as any)?.type);
        
        // Only allow deletion if node type is DETOUR or CONDITIONAL
        // Act, Chapter, and Page nodes must be deleted from graph editor first
        if (nodeType !== FORGE_NODE_TYPE.DETOUR && 
            nodeType !== FORGE_NODE_TYPE.CONDITIONAL) {
          const nodeTypeName = nodeType === FORGE_NODE_TYPE.ACT ? 'Act' :
                              nodeType === FORGE_NODE_TYPE.CHAPTER ? 'Chapter' :
                              nodeType === FORGE_NODE_TYPE.PAGE ? 'Page' : 'node';
          toast.error(`Cannot delete page. Delete the corresponding ${nodeTypeName} node from the narrative graph editor first.`);
          return;
        }
      }
    }
    
    if (!confirm(`Delete "${page.title}"?`)) return;

    try {
      if (dataAdapter?.deletePage) {
        await dataAdapter.deletePage(page.id);
        
        const updatedPages = pages.filter(p => p.id !== page.id);
        setPages(updatedPages);

        if (activePageId === page.id) {
          setActivePageId(null);
        }

        // Remove from graph if node exists
        if (effectiveGraph) {
          const nodeToDelete = effectiveGraph.flow.nodes.find(
            n => (n.data as any)?.pageId === page.id
          );
          
          if (nodeToDelete) {
            const updatedNodes = effectiveGraph.flow.nodes.filter(n => n.id !== nodeToDelete.id);
            
            const updatedEdges = effectiveGraph.flow.edges.filter(
              e => e.source !== nodeToDelete.id && e.target !== nodeToDelete.id
            );
            
            const updatedGraph: ForgeGraphDoc = {
              ...effectiveGraph,
              flow: {
                nodes: updatedNodes,
                edges: updatedEdges,
                viewport: effectiveGraph.flow.viewport,
              },
            };

            setNarrativeGraph(updatedGraph);
            
            // Also update via forgeDataAdapter if available
            if (forgeDataAdapter) {
              await forgeDataAdapter.updateGraph(updatedGraph.id, {
                title: updatedGraph.title,
                flow: updatedGraph.flow,
                startNodeId: updatedGraph.startNodeId,
                endNodeIds: updatedGraph.endNodeIds,
                compiledYarn: updatedGraph.compiledYarn ?? null,
              });
            }
          }
        }
        
        toast.success('Page deleted');
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('Failed to delete page');
    }
  }, [dataAdapter, effectiveGraph, forgeDataAdapter, pages, setPages, activePageId, setActivePageId, setNarrativeGraph, toast]);

  // Handle adding Act at top level
  const handleAddAct = useCallback(async () => {
    await handleAddChild(null, PAGE_TYPE.ACT);
  }, [handleAddChild]);

  // Handle creating a new narrative graph
  const handleCreateNarrativeGraph = useCallback(async () => {
    if (!projectId || !forgeDataAdapter || isCreating) {
      if (!projectId) {
        toast.error('No project selected');
      }
      return;
    }

    try {
      setIsCreating(true);
      const newGraph = await createNarrativeGraph(projectId);
      if (newGraph) {
        toast.success('Narrative graph created');
      }
    } catch (error) {
      console.error('[WriterTree] Failed to create narrative graph:', error);
      toast.error('Failed to create narrative graph');
    } finally {
      setIsCreating(false);
    }
  }, [projectId, forgeDataAdapter, isCreating, createNarrativeGraph, toast]);

  return (
    <div className={`flex h-full min-h-0 flex-col gap-2 ${className ?? ''}`}>
      {/* Graph Selector - Always show */}
      <div className="flex-shrink-0 px-3 pt-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
            Narrative Graph
          </label>
          <button
            onClick={handleCreateNarrativeGraph}
            disabled={!projectId || isCreating || !forgeDataAdapter}
            className="flex items-center justify-center h-5 w-5 rounded border border-df-node-border bg-df-control-bg hover:bg-df-control-hover text-df-text-secondary hover:text-df-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Create new narrative graph"
          >
            <Plus size={12} />
          </button>
        </div>
        <select
          className="mt-1 w-full rounded-md border border-df-node-border bg-df-control-bg px-2 py-1 text-xs text-df-text-primary"
          value={selectedNarrativeGraphId ?? ''}
          onChange={(e) => {
            const graphId = e.target.value ? Number(e.target.value) : null;
            setSelectedNarrativeGraphId(graphId);
            if (graphId) {
              const selected = narrativeGraphs.find(g => g.id === graphId);
              if (selected) {
                setNarrativeGraph(selected);
              }
            }
          }}
          disabled={narrativeGraphs.length === 0}
        >
          {narrativeGraphs.length === 0 ? (
            <option value="">No graphs available</option>
          ) : (
            narrativeGraphs.map((graph) => (
              <option key={graph.id} value={String(graph.id)}>
                {graph.title}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
          NARRATIVE OUTLINE
        </h2>
      </div>

      {/* Tree */}
      <div ref={treeContainerRef} className="flex min-h-0 flex-1 flex-col">
        {treeData.length === 0 ? (
          // Empty state with placeholder section
          <div className="px-2 py-2">
            <div className="group flex items-center gap-1 px-2 py-1">
              <div className="flex h-6 w-6 items-center justify-center">
                <BookOpen size={14} className="text-df-text-tertiary" />
              </div>
              <div className="flex flex-1 items-center gap-2 text-xs text-df-text-tertiary italic">
                No acts yet
              </div>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-df-control-bg hover:text-df-text-primary transition-all"
                onClick={handleAddAct}
                disabled={isCreating}
                title="Add Act"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        ) : (
          <Tree
            key={`tree-${narrativeGraph?.id || 'no-graph'}-${narrativeGraph?.flow.nodes.length || 0}`}
            initialData={treeData}
            height={treeHeight}
            width="100%"
            indent={24}
            rowHeight={32}
            overscanCount={5}
            openByDefault={true}
            disableMultiSelection={true}
            selection={selectedNodeId || undefined}
            onSelect={(nodes) => {
              if (nodes && nodes.length > 0) {
                const selectedNode = nodes[0];
                const pageId = selectedNode.data?.page?.id;
                if (pageId) {
                  setActivePageId(pageId);
                }
              }
            }}
          >
            {(props) => {
              const page = props.node.data?.page;
              const pageId = page?.id;
              const isSelected = pageId === activePageId;
              const hasDetour = props.node.data?.hasDetour ?? false;
              const isEndNode = props.node.data?.isEndNode ?? false;
              const canAddChild = page?.pageType !== PAGE_TYPE.PAGE;
              
              return (
                <WriterTreeRow
                  node={props.node}
                  style={props.style}
                  dragHandle={props.dragHandle}
                  icon={page ? getIconForPageType(page.pageType) : null}
                  isSelected={isSelected}
                  onSelect={() => {
                    if (pageId) {
                      setActivePageId(pageId);
                    }
                  }}
                  onAddChild={() => {
                    if (page) {
                      handleAddChild(page);
                    }
                  }}
                  canAddChild={canAddChild}
                  hasDetour={hasDetour}
                  hasConditional={props.node.data?.hasConditional ?? false}
                  isEndNode={isEndNode}
                />
              );
            }}
          </Tree>
        )}
      </div>
    </div>
  );
}
