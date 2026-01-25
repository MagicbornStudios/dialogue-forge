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
import { FORGE_NODE_TYPE } from '@/shared/types/forge-graph';
import { calculateDelta } from '@/shared/lib/draft/draft-helpers';

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
 */
function hasDetourConnection(graph: ForgeGraphDoc | null, nodeId: string | null): boolean {
  if (!graph || !nodeId) return false;
  
  const node = graph.flow.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  
  const outgoingEdges = graph.flow.edges.filter(e => e.source === nodeId);
  return outgoingEdges.some(edge => {
    const targetNode = graph.flow.nodes.find(n => n.id === edge.target);
    return targetNode?.type === FORGE_NODE_TYPE.DETOUR;
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
 */
function findNodeIdByPageId(graph: ForgeGraphDoc | null, pageId: number): string | null {
  if (!graph) return null;
  const node = graph.flow.nodes.find(n => n.data?.pageId === pageId);
  return node?.id || null;
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

function buildTreeData(pages: ForgePage[], graph: ForgeGraphDoc | null): TreeNode[] {
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    return [];
  }
  
  const hierarchy = buildNarrativeHierarchy(pages);
  
  return hierarchy.acts.map(({ page: actPage, chapters }) => {
    const actNodeId = findNodeIdByPageId(graph, actPage.id);
    return {
      id: `page-${actPage.id}`,
      name: actPage.title,
      page: actPage,
      hasDetour: hasDetourConnection(graph, actNodeId),
      isEndNode: isEndNode(graph, actNodeId),
      children: chapters.map(({ page: chapterPage, pages: contentPages }) => {
        const chapterNodeId = findNodeIdByPageId(graph, chapterPage.id);
        return {
          id: `page-${chapterPage.id}`,
          name: chapterPage.title,
          page: chapterPage,
          hasDetour: hasDetourConnection(graph, chapterNodeId),
          isEndNode: isEndNode(graph, chapterNodeId),
          children: contentPages.map(page => {
            const pageNodeId = findNodeIdByPageId(graph, page.id);
            return {
              id: `page-${page.id}`,
              name: page.title,
              page,
              hasDetour: hasDetourConnection(graph, pageNodeId),
              isEndNode: isEndNode(graph, pageNodeId),
            };
          }),
        };
      }),
    };
  });
}

export function WriterTree({ className, projectId: projectIdProp }: WriterTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [treeHeight, setTreeHeight] = useState(400);
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
  const forgeDataAdapter = useWriterWorkspaceStore((state) => state.forgeDataAdapter);
  const narrativeGraphs = useWriterWorkspaceStore((state) => state.narrativeGraphs);
  const selectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.selectedNarrativeGraphId);
  const narrativeGraph = useWriterWorkspaceStore((state) => state.narrativeGraph);
  const committedGraph = useWriterWorkspaceStore((state) => state.committedGraph);
  const draftGraph = useWriterWorkspaceStore((state) => state.draftGraph);
  
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const setPages = useWriterWorkspaceStore((state) => state.actions.setPages);
  const setNarrativeGraph = useWriterWorkspaceStore((state) => state.actions.setNarrativeGraph);
  const setSelectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.actions.setSelectedNarrativeGraphId);
  const createNarrativeGraph = useWriterWorkspaceStore((state) => state.actions.createNarrativeGraph);
  const applyDelta = useWriterWorkspaceStore((state) => state.actions.applyDelta);
  const commitDraft = useWriterWorkspaceStore((state) => state.actions.commitDraft);

  const effectiveGraph = draftGraph ?? narrativeGraph;

  const projectId = projectIdProp ?? pages[0]?.project ?? null;

  // Graph-page sync hook
  const { createPageWithNode } = useGraphPageSync({
    graph: narrativeGraph,
    committedGraph,
    draftGraph,
    applyDelta,
    commitDraft,
    pages,
    projectId,
    dataAdapter,
    forgeDataAdapter,
    onGraphUpdate: setNarrativeGraph,
    onPagesUpdate: setPages,
  });

  // Build tree data from pages with graph metadata
  const treeNodes = useMemo(() => buildTreeData(pages || [], effectiveGraph), [pages, effectiveGraph]);
  
  // Convert to react-arborist format
  const treeData = useMemo(() => {
    const convertNode = (node: TreeNode): any => ({
      id: node.id,
      name: node.name,
      page: node.page,
      hasDetour: node.hasDetour,
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

  // Handle page rename
  const handleRenamePage = useCallback(async (page: ForgePage) => {
    const newTitle = prompt('Rename page:', page.title);
    if (!newTitle || newTitle === page.title) return;

    try {
      if (dataAdapter?.updatePage) {
        await dataAdapter.updatePage(page.id, { title: newTitle });
        
        const updatedPages = pages.map(p =>
          p.id === page.id ? { ...p, title: newTitle } : p
        );
        setPages(updatedPages);

        // Update graph node if it exists
        if (effectiveGraph) {
          const nodeToUpdate = Object.values(effectiveGraph.flow.nodes).find(
            n => n.data?.pageId === page.id
          );
          if (nodeToUpdate) {
            const updatedGraph: ForgeGraphDoc = {
              ...effectiveGraph,
              flow: {
                ...effectiveGraph.flow,
                nodes: effectiveGraph.flow.nodes.map((node) =>
                  node.id === nodeToUpdate.id
                    ? {
                        ...node,
                        data: { ...node.data, title: newTitle, label: newTitle },
                      }
                    : node
                ),
              },
            };

            const committedGraphForDelta = committedGraph ?? effectiveGraph;
            applyDelta(calculateDelta(committedGraphForDelta, updatedGraph));
            await commitDraft();
          }
        }
        
        toast.success('Page renamed');
      }
    } catch (error) {
      console.error('Failed to rename page:', error);
      toast.error('Failed to rename page');
    }
  }, [applyDelta, commitDraft, committedGraph, dataAdapter, effectiveGraph, pages, setPages, toast]);

  // Handle page deletion
  const handleDeletePage = useCallback(async (page: ForgePage) => {
    // Check if page has children
    const hasChildren = pages.some(p => p.parent === page.id);
    
    if (hasChildren) {
      toast.warning('Cannot delete page with children. Delete children first.');
      return;
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

        // Remove from graph
        if (effectiveGraph) {
          const nodeToDelete = effectiveGraph.flow.nodes.find(
            n => n.data?.pageId === page.id
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

            const committedGraphForDelta = committedGraph ?? effectiveGraph;
            applyDelta(calculateDelta(committedGraphForDelta, updatedGraph));
            await commitDraft();
          }
        }
        
        toast.success('Page deleted');
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('Failed to delete page');
    }
  }, [applyDelta, commitDraft, committedGraph, dataAdapter, effectiveGraph, pages, setPages, activePageId, setActivePageId, toast]);

  // Handle adding Act at top level
  const handleAddAct = useCallback(async () => {
    await handleAddChild(null, PAGE_TYPE.ACT);
  }, [handleAddChild]);

  return (
    <div className={`flex h-full min-h-0 flex-col gap-2 ${className ?? ''}`}>
      {/* Graph Selector - Always show */}
      <div className="flex-shrink-0 px-3 pt-3">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
          Narrative Graph
        </label>
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
