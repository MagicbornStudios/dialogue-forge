'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { BookOpen, FileText, File, Plus } from 'lucide-react';
import { Tree } from 'react-arborist';
import { WriterTreeRow } from './WriterTreeRow';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { PAGE_TYPE, buildNarrativeHierarchy, type ForgePage, type PageType } from '@/shared/types/narrative';
import { useToast } from '@/shared/ui/toast';

interface WriterTreeProps {
  className?: string;
  projectId?: number | null;
}

type TreeNode = {
  id: string;
  name: string;
  page: ForgePage;
  children?: TreeNode[];
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

/** Build tree nodes from pages using parent + order (no graph). */
function buildTreeFromPages(pages: ForgePage[]): TreeNode[] {
  if (!pages?.length) return [];
  const hierarchy = buildNarrativeHierarchy(pages);
  return hierarchy.acts.map(({ page: actPage, chapters }) => ({
    id: `page-${actPage.id}`,
    name: actPage.title,
    page: actPage,
    children: chapters.map(({ page: chapterPage, pages: contentPages }) => ({
      id: `page-${chapterPage.id}`,
      name: chapterPage.title,
      page: chapterPage,
      children: contentPages.map((p) => ({
        id: `page-${p.id}`,
        name: p.title,
        page: p,
        children: undefined,
      })),
    })),
  }));
}

export function WriterTree({ className, projectId: projectIdProp }: WriterTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [treeHeight, setTreeHeight] = useState(400);
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
  const narrativeGraphs = useWriterWorkspaceStore((state) => state.narrativeGraphs);
  const selectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.selectedNarrativeGraphId);

  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const setPages = useWriterWorkspaceStore((state) => state.actions.setPages);
  const setSelectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.actions.setSelectedNarrativeGraphId);
  const setNarrativeGraph = useWriterWorkspaceStore((state) => state.actions.setNarrativeGraph);
  const createNarrativeGraph = useWriterWorkspaceStore((state) => state.actions.createNarrativeGraph);

  const projectId = projectIdProp ?? pages[0]?.project ?? null;

  const refetchPagesForGraph = useCallback(async () => {
    if (!projectId || !dataAdapter || selectedNarrativeGraphId == null) return;
    try {
      const list = await dataAdapter.listPages(projectId, selectedNarrativeGraphId);
      setPages(list);
    } catch (err) {
      console.error('[WriterTree] Failed to refetch pages:', err);
    }
  }, [projectId, selectedNarrativeGraphId, dataAdapter, setPages]);

  const handleCreateNewGraph = useCallback(async () => {
    if (!projectId || isCreating) return;
    try {
      setIsCreating(true);
      await createNarrativeGraph(projectId);
      // Pages for the new graph load via WriterWorkspaceContent useEffect when selectedNarrativeGraphId updates
    } catch (err) {
      console.error('[WriterTree] Failed to create narrative graph:', err);
      toast.error('Failed to create narrative graph');
    } finally {
      setIsCreating(false);
    }
  }, [projectId, isCreating, createNarrativeGraph, toast]);

  const treeNodes = useMemo(
    () => buildTreeFromPages(pages ?? []),
    [pages]
  );

  const treeData = useMemo(() => {
    const convertNode = (node: TreeNode): any => ({
      id: node.id,
      name: node.name,
      page: node.page,
      children: node.children?.map(convertNode) || [],
    });
    return treeNodes.map(convertNode);
  }, [treeNodes]);

  const selectedNodeId: string | undefined = useMemo(() => {
    if (!activePageId) return undefined;
    const findNodeId = (nodes: TreeNode[]): string | undefined => {
      for (const node of nodes) {
        if (node.page.id === activePageId) return node.id;
        if (node.children) {
          const found = findNodeId(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findNodeId(treeNodes);
  }, [activePageId, treeNodes]);

  useEffect(() => {
    const updateHeight = () => {
      if (treeContainerRef.current) {
        const height = treeContainerRef.current.clientHeight;
        if (height > 0) setTreeHeight(height);
      }
    };
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (treeContainerRef.current) resizeObserver.observe(treeContainerRef.current);
    window.addEventListener('resize', updateHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [treeData.length]);

  const handleCreateFirstAct = useCallback(async () => {
    if (!projectId || !dataAdapter || !selectedNarrativeGraphId || isCreating) {
      if (!selectedNarrativeGraphId) {
        toast.error('Select a narrative graph first');
      }
      return;
    }
    try {
      setIsCreating(true);
      const newPage = await dataAdapter.createPage({
        projectId,
        narrativeGraph: selectedNarrativeGraphId,
        pageType: PAGE_TYPE.ACT,
        title: 'Act I',
        order: 0,
        parent: null,
      });
      setPages([...(pages ?? []), newPage]);
    } catch (error) {
      console.error('[WriterTree] Failed to create first act:', error);
      toast.error('Failed to create first act');
    } finally {
      setIsCreating(false);
    }
  }, [projectId, selectedNarrativeGraphId, dataAdapter, isCreating, pages, setPages, toast]);

  const handleAddChild = useCallback(
    async (parentPage: ForgePage | null, pageType?: PageType) => {
      if (isCreating || !projectId || !dataAdapter || !selectedNarrativeGraphId) {
        if (!selectedNarrativeGraphId) toast.error('Select a narrative graph first');
        return;
      }
      try {
        setIsCreating(true);
        const childType =
          pageType ||
          (parentPage?.pageType === PAGE_TYPE.ACT ? PAGE_TYPE.CHAPTER : PAGE_TYPE.PAGE);
        const siblings = (pages ?? []).filter(
          (p) => p.pageType === childType && p.parent === (parentPage?.id ?? null)
        );
        const order = siblings.length;
        const title =
          childType === PAGE_TYPE.CHAPTER
            ? `Chapter ${order + 1}`
            : `Page ${order + 1}`;
        const newPage = await dataAdapter.createPage({
          projectId,
          narrativeGraph: selectedNarrativeGraphId,
          pageType: childType,
          title,
          order,
          parent: parentPage?.id ?? null,
        });
        await refetchPagesForGraph();
        if (childType === PAGE_TYPE.PAGE) setActivePageId(newPage.id);
      } catch (error) {
        console.error('[WriterTree] Failed to add child:', error);
        toast.error('Failed to add page');
      } finally {
        setIsCreating(false);
      }
    },
    [
      isCreating,
      projectId,
      selectedNarrativeGraphId,
      dataAdapter,
      pages,
      setPages,
      setActivePageId,
      refetchPagesForGraph,
      toast,
    ]
  );

  const handleRenamePage = useCallback(
    async (page: ForgePage) => {
      const newTitle = prompt('Rename page:', page.title);
      if (!newTitle || newTitle === page.title) return;
      try {
        await dataAdapter!.updatePage(page.id, { title: newTitle });
        setPages(
          (pages ?? []).map((p) => (p.id === page.id ? { ...p, title: newTitle } : p))
        );
        toast.success('Page renamed');
      } catch (error) {
        console.error('Failed to rename page:', error);
        toast.error('Failed to rename page');
      }
    },
    [dataAdapter, pages, setPages, toast]
  );

  const handleDeletePage = useCallback(
    async (page: ForgePage) => {
      const hasChildren = (pages ?? []).some((p) => p.parent === page.id);
      if (hasChildren) {
        toast.warning('Cannot delete page with children. Delete children first.');
        return;
      }
      if (!confirm(`Delete "${page.title}"?`)) return;
      try {
        await dataAdapter!.deletePage(page.id);
        setPages((pages ?? []).filter((p) => p.id !== page.id));
        if (activePageId === page.id) setActivePageId(null);
        toast.success('Page deleted');
      } catch (error) {
        console.error('Failed to delete page:', error);
        toast.error('Failed to delete page');
      }
    },
    [dataAdapter, pages, activePageId, setPages, setActivePageId, toast]
  );

  const handleAddAct = useCallback(() => handleAddChild(null, PAGE_TYPE.ACT), [handleAddChild]);

  const canAddActs = !!selectedNarrativeGraphId && !!projectId && !!dataAdapter;

  return (
    <div className={`flex h-full min-h-0 flex-col gap-2 ${className ?? ''}`}>
      <div className="flex-shrink-0 px-3 pt-3">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
          Narrative Graph
        </label>
        <div className="flex gap-1">
          <select
            className="mt-1 flex-1 min-w-0 rounded-md border border-df-node-border bg-df-control-bg px-2 py-1 text-xs text-df-text-primary"
            value={selectedNarrativeGraphId ?? ''}
            onChange={(e) => {
              const graphId = e.target.value ? Number(e.target.value) : null;
              setSelectedNarrativeGraphId(graphId);
              if (graphId) {
                const selected = narrativeGraphs.find((g) => g.id === graphId);
                if (selected) setNarrativeGraph(selected);
              }
            }}
            disabled={narrativeGraphs.length === 0}
          >
            {narrativeGraphs.length === 0 ? (
              <option value="">No graphs</option>
            ) : (
              narrativeGraphs.map((graph) => (
                <option key={graph.id} value={String(graph.id)}>
                  {graph.title}
                </option>
              ))
            )}
          </select>
          {projectId && dataAdapter && (
            <button
              type="button"
              className="mt-1 flex-shrink-0 rounded-md border border-df-node-border bg-df-control-bg px-2 py-1 text-xs text-df-text-primary hover:bg-df-control-hover"
              onClick={handleCreateNewGraph}
              disabled={isCreating}
              title="New narrative graph"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
          NARRATIVE OUTLINE
        </h2>
      </div>

      <div ref={treeContainerRef} className="flex min-h-0 flex-1 flex-col">
        {treeData.length === 0 ? (
          <div className="px-2 py-2">
            <div className="group flex items-center gap-1 px-2 py-1">
              <div className="flex h-6 w-6 items-center justify-center">
                <BookOpen size={14} className="text-df-text-tertiary" />
              </div>
              <div className="flex flex-1 items-center gap-2 text-xs text-df-text-tertiary italic">
                {!selectedNarrativeGraphId
                  ? 'Select a narrative graph'
                  : 'No acts yet'}
              </div>
              {canAddActs && (
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-df-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-df-control-bg hover:text-df-text-primary transition-all"
                  onClick={handleAddAct}
                  disabled={isCreating}
                  title="Add Act"
                >
                  <Plus size={12} />
                </button>
              )}
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
              if (nodes?.length > 0) {
                const pageId = nodes[0].data?.page?.id;
                if (pageId) setActivePageId(pageId);
              }
            }}
          >
            {(props) => {
              const page = props.node.data?.page;
              const pageId = page?.id;
              const isSelected = pageId === activePageId;
              const canAddChild = page?.pageType !== PAGE_TYPE.PAGE;
              return (
                <WriterTreeRow
                  node={props.node}
                  style={props.style}
                  dragHandle={props.dragHandle}
                  icon={page ? getIconForPageType(page.pageType) : null}
                  isSelected={isSelected}
                  onSelect={() => pageId && setActivePageId(pageId)}
                  onAddChild={() => page && handleAddChild(page)}
                  canAddChild={canAddChild}
                  hasDetour={false}
                  isEndNode={false}
                />
              );
            }}
          </Tree>
        )}
      </div>
    </div>
  );
}
