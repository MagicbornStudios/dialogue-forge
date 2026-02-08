import React, { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { WriterEvent } from '@magicborn/writer/events/writer-events';
import { FORGE_GRAPH_KIND } from '@magicborn/shared/types/forge-graph';
import {
  fetchForgeGraph,
  useCreateForgeGraph,
  useForgeGraphs,
  useForgeProject,
  useUpdateForgeGraph,
  useForgePayloadClient,
} from '@magicborn/forge';
import {
  useCreateWriterPage,
  useUpdateWriterPage,
  useWriterPages,
} from '@magicborn/writer/data/writer-queries';
import {
  WriterWorkspaceStoreProvider,
  createWriterWorkspaceStore,
  useWriterWorkspaceStore,
  buildOnCommitWriterDraft,
  createNarrativeGraph,
  type WriterWorkspaceCallbacks,
} from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
import { setupWriterWorkspaceSubscriptions } from '@magicborn/writer/components/WriterWorkspace/store/slices/subscriptions';
import { WriterTree } from '@magicborn/writer/components/WriterWorkspace/sidebar/WriterTree';
import { WriterLayout } from '@magicborn/writer/components/WriterWorkspace/layout/WriterLayout';
import { WriterEditorPane } from '@magicborn/writer/components/WriterWorkspace/editor/WriterEditorPane';
import { WriterWorkspaceModalsRenderer } from '@magicborn/writer/components/WriterWorkspace/modals/WriterWorkspaceModals';
import { Toaster } from '@magicborn/shared/ui/toast';
import { validateNarrativeGraph } from '@magicborn/shared/lib/graph-validation';
import { toast } from 'sonner';

interface WriterWorkspaceProps {
  pages?: ForgePage[];
  className?: string;
  initialActivePageId?: number | null;
  onActivePageChange?: (pageId: number | null) => void;
  onEvent?: (event: WriterEvent) => void;
  projectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
  topBar?: React.ReactNode;
}

export function WriterWorkspace({
  pages = [],
  className = '',
  initialActivePageId = null,
  onActivePageChange,
  onEvent,
  projectId,
  topBar,
}: WriterWorkspaceProps) {
  const payloadClient = useForgePayloadClient();
  const queryClient = useQueryClient();
  const createWriterPage = useCreateWriterPage();
  const updateWriterPage = useUpdateWriterPage();
  const createForgeGraph = useCreateForgeGraph();
  const updateForgeGraph = useUpdateForgeGraph();
  const narrativeGraphsQuery = useForgeGraphs(projectId ?? null, FORGE_GRAPH_KIND.NARRATIVE);
  const projectQuery = useForgeProject(projectId ?? null);

  const eventSinkRef = useRef({
    emit: (event: WriterEvent) => {
      onEvent?.(event);
    },
  });

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const payloadClientRef = useRef(payloadClient);
  payloadClientRef.current = payloadClient;
  const createWriterPageRef = useRef(createWriterPage);
  createWriterPageRef.current = createWriterPage;
  const updateWriterPageRef = useRef(updateWriterPage);
  updateWriterPageRef.current = updateWriterPage;
  const createForgeGraphRef = useRef(createForgeGraph);
  createForgeGraphRef.current = createForgeGraph;
  const updateForgeGraphRef = useRef(updateForgeGraph);
  updateForgeGraphRef.current = updateForgeGraph;

  const callbacksRef = useRef<WriterWorkspaceCallbacks | null>(null);
  callbacksRef.current = {
    updatePage: (id, patch) =>
      updateWriterPageRef.current.mutateAsync({ pageId: id, patch }),
    createPage: (input) =>
      createWriterPageRef.current.mutateAsync(
        input as Parameters<typeof createWriterPageRef.current.mutateAsync>[0]
      ),
    getNarrativeGraph: (id) =>
      fetchForgeGraph(queryClientRef.current, payloadClientRef.current, id),
    createNarrativeGraph: (nextProjectId: number) =>
      createNarrativeGraph(
        {
          createGraph: (input) => createForgeGraphRef.current.mutateAsync(input),
        },
        nextProjectId
      ),
    onCommitWriterDraft: buildOnCommitWriterDraft({
      createPage: (input) => createWriterPageRef.current.mutateAsync(input),
      updateGraph: (graphId, patch) =>
        updateForgeGraphRef.current.mutateAsync({ graphId, patch }),
    }),
  };

  const getCallbacks = useCallback(() => callbacksRef.current, []);

  const storeRef = useRef(
    createWriterWorkspaceStore(
      {
        initialPages: pages,
        initialActivePageId,
        getCallbacks,
      },
      eventSinkRef.current
    )
  );

  const fetchNarrativeGraphRef = useRef<
    ((id: number) => Promise<import('@magicborn/shared/types/forge-graph').ForgeGraphDoc>) | null
  >(null);
  fetchNarrativeGraphRef.current = (id: number) =>
    fetchForgeGraph(queryClientRef.current, payloadClientRef.current, id);
  const fetchNarrativeGraph = useCallback((id: number) => {
    const fn = fetchNarrativeGraphRef.current;
    if (!fn) return Promise.reject(new Error('No narrative graph loader'));
    return fn(id);
  }, []);

  useEffect(() => {
    setupWriterWorkspaceSubscriptions(storeRef.current, eventSinkRef.current, fetchNarrativeGraph);
  }, [fetchNarrativeGraph]);

  useEffect(() => {
    const store = storeRef.current;
    store.getState().actions.setPages(pages);
  }, [pages]);

  useEffect(() => {
    storeRef.current.getState().actions.setActivePageId(initialActivePageId ?? null);
  }, [initialActivePageId]);

  useEffect(() => {
    const store = storeRef.current;
    if (!projectId) {
      store.getState().actions.setNarrativeGraphs([]);
      store.getState().actions.setSelectedNarrativeGraphId(null);
      store.getState().actions.setNarrativeGraph(null);
      return;
    }

    if (!narrativeGraphsQuery.isSuccess) return;

    const graphs = narrativeGraphsQuery.data ?? [];
    const projectNarrativeGraphId = projectQuery.data?.narrativeGraph ?? null;
    const state = store.getState();
    state.actions.setNarrativeGraphs(graphs);

    const selectedGraphId = state.selectedNarrativeGraphId;
    const hasCurrent =
      selectedGraphId != null && graphs.some((graph) => graph.id === selectedGraphId);
    const nextSelectedGraphId = hasCurrent
      ? selectedGraphId
      : projectNarrativeGraphId != null &&
          graphs.some((graph) => graph.id === projectNarrativeGraphId)
        ? projectNarrativeGraphId
        : graphs[0]?.id ?? null;

    state.actions.setSelectedNarrativeGraphId(nextSelectedGraphId);
    const selectedGraph =
      nextSelectedGraphId == null
        ? null
        : graphs.find((graph) => graph.id === nextSelectedGraphId) ?? null;
    state.actions.setNarrativeGraph(selectedGraph);

    if (selectedGraph) {
      const validation = validateNarrativeGraph(selectedGraph);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          toast.error(error.message);
        });
      }
      validation.warnings.forEach((warning) => {
        toast.warning(warning.message);
      });
    }
  }, [
    narrativeGraphsQuery.data,
    narrativeGraphsQuery.isSuccess,
    projectId,
    projectQuery.data?.narrativeGraph,
  ]);

  return (
    <>
      <WriterWorkspaceStoreProvider store={storeRef.current}>
        <WriterWorkspaceContent
          className={className}
          onActivePageChange={onActivePageChange}
          projectId={projectId}
          topBar={topBar}
        />
      </WriterWorkspaceStoreProvider>
      <Toaster />
    </>
  );
}

function WriterWorkspaceContent({
  className,
  onActivePageChange,
  projectId,
  topBar,
}: Pick<WriterWorkspaceProps, 'className' | 'onActivePageChange' | 'projectId' | 'topBar'>) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePage = activePageId ? pages.find((page) => page.id === activePageId) ?? null : null;
  const selectedNarrativeGraphId = useWriterWorkspaceStore(
    (state) => state.selectedNarrativeGraphId
  );

  const setPages = useWriterWorkspaceStore((state) => state.actions.setPages);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const setContentError = useWriterWorkspaceStore((state) => state.actions.setContentError);

  const pagesQuery = useWriterPages(projectId ?? null, selectedNarrativeGraphId);

  useEffect(() => {
    if (!projectId || selectedNarrativeGraphId == null) {
      setPages([]);
      if (!projectId) setActivePageId(null);
      setContentError(null);
      return;
    }

    if (pagesQuery.isError) {
      setContentError('Failed to load data');
      return;
    }

    if (pagesQuery.isSuccess) {
      setPages(pagesQuery.data ?? []);
      setContentError(null);
    }
  }, [
    pagesQuery.data,
    pagesQuery.isError,
    pagesQuery.isSuccess,
    projectId,
    selectedNarrativeGraphId,
    setActivePageId,
    setContentError,
    setPages,
  ]);

  useEffect(() => {
    onActivePageChange?.(activePageId ?? null);
  }, [activePageId, onActivePageChange]);

  return (
    <>
      <div className={`flex h-full w-full flex-col ${className}`}>
        {topBar}
        <WriterLayout
          sidebar={<WriterTree projectId={projectId} />}
          editor={<WriterEditorPane />}
        />
      </div>
      <WriterWorkspaceModalsRenderer activePage={activePage} />
    </>
  );
}
