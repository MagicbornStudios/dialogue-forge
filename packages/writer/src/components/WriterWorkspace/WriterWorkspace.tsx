import React, { useRef, useEffect, useCallback } from 'react';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@magicborn/writer/types/forge-data-adapter';
import type { WriterEvent } from '@magicborn/writer/events/writer-events';
import { FORGE_GRAPH_KIND } from '@magicborn/shared/types/forge-graph';
import { useWriterDataContext } from '@magicborn/writer/components/WriterWorkspace/WriterDataContext';
import { useForgeDataContext } from '@magicborn/forge';
import {
  WriterWorkspaceStoreProvider,
  createWriterWorkspaceStore,
  useWriterWorkspaceStore,
  buildOnCommitWriterDraft,
  createNarrativeGraphWithAdapter,
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
  dataAdapter?: WriterDataAdapter;
  forgeDataAdapter?: WriterForgeDataAdapter;
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
  dataAdapter,
  forgeDataAdapter,
  projectId,
  onProjectChange,
  topBar,
}: WriterWorkspaceProps) {
  const writerAdapterFromContext = useWriterDataContext();
  const forgeAdapterFromContext = useForgeDataContext();
  const effectiveWriterAdapter = dataAdapter ?? writerAdapterFromContext ?? undefined;
  const effectiveForgeAdapter = forgeDataAdapter ?? forgeAdapterFromContext ?? undefined;

  const eventSinkRef = useRef({
    emit: (event: WriterEvent) => {
      if (onEvent) onEvent(event);
    },
  });

  const callbacksRef = useRef<WriterWorkspaceCallbacks | null>(null);
  function buildCallbacks(w: WriterDataAdapter | undefined, f: WriterForgeDataAdapter | undefined): WriterWorkspaceCallbacks | null {
    if (!w || !f) return null;
    return {
      updatePage: (id: number, patch: Partial<ForgePage>) => w.updatePage(id, patch),
      createPage: (input) => w.createPage(input as Parameters<WriterDataAdapter['createPage']>[0]),
      getNarrativeGraph: (id: number) => f.getGraph(id),
      createNarrativeGraph: (projectId: number) => createNarrativeGraphWithAdapter(f, projectId),
      onCommitWriterDraft: buildOnCommitWriterDraft(w, f),
    };
  }
  callbacksRef.current = buildCallbacks(effectiveWriterAdapter, effectiveForgeAdapter);

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

  const fetchNarrativeGraphRef = useRef<((id: number) => Promise<import('@magicborn/shared/types/forge-graph').ForgeGraphDoc>) | null>(null);
  fetchNarrativeGraphRef.current = effectiveForgeAdapter ? (id: number) => effectiveForgeAdapter.getGraph(id) : null;
  const fetchNarrativeGraph = useCallback((id: number) => {
    const fn = fetchNarrativeGraphRef.current;
    if (!fn) return Promise.reject(new Error('No narrative graph loader'));
    return fn(id);
  }, []);

  React.useEffect(() => {
    setupWriterWorkspaceSubscriptions(storeRef.current, eventSinkRef.current, fetchNarrativeGraph);
  }, [fetchNarrativeGraph]);

  useEffect(() => {
    const store = storeRef.current;
    store.getState().actions.setPages(pages);
  }, [pages]);

  useEffect(() => {
    storeRef.current.getState().actions.setActivePageId(initialActivePageId ?? null);
  }, [initialActivePageId]);

  // Load all narrative graphs when project changes
  useEffect(() => {
    if (!projectId || !effectiveForgeAdapter) {
      const store = storeRef.current;
      store.getState().actions.setNarrativeGraphs([]);
      store.getState().actions.setSelectedNarrativeGraphId(null);
      store.getState().actions.setNarrativeGraph(null);
      return;
    }

    let cancelled = false;
    const store = storeRef.current;

    async function loadNarrativeGraphs() {
      if (!effectiveForgeAdapter || !projectId) {
        return;
      }
      try {
        const project = await effectiveForgeAdapter.getProject(projectId);
        const graphs = await effectiveForgeAdapter.listGraphs(projectId, FORGE_GRAPH_KIND.NARRATIVE);
        
        if (!cancelled) {
          store.getState().actions.setNarrativeGraphs(graphs);
          
          // Set default: use project.narrativeGraph if it exists and is in list, otherwise first graph
          const narrativeGraphId = typeof project.narrativeGraph === 'object' && project.narrativeGraph !== null ? (project.narrativeGraph as { id: number }).id : project.narrativeGraph;
          const defaultGraphId = narrativeGraphId != null &&
            graphs.some((g: { id: number }) => g.id === narrativeGraphId)
              ? narrativeGraphId
              : graphs[0]?.id ?? null;

          store.getState().actions.setSelectedNarrativeGraphId(defaultGraphId);
          const selectedGraph = graphs.find((g: { id: number }) => g.id === defaultGraphId) ?? null;
          store.getState().actions.setNarrativeGraph(selectedGraph);
          
          if (selectedGraph) {
            const validation = validateNarrativeGraph(selectedGraph);
            
            if (!validation.valid) {
              validation.errors.forEach(error => {
                toast.error(error.message);
              });
            }
            
            validation.warnings.forEach(warning => {
              toast.warning(warning.message);
            });
          }
        }
      } catch (error) {
        console.error('Failed to load narrative graphs:', error);
        if (!cancelled) {
          store.getState().actions.setNarrativeGraphs([]);
          store.getState().actions.setSelectedNarrativeGraphId(null);
          store.getState().actions.setNarrativeGraph(null);
          toast.error('Failed to load narrative graph');
        }
      }
    }

    void loadNarrativeGraphs();

    return () => {
      cancelled = true;
    };
  }, [projectId, effectiveForgeAdapter]);

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
  const activePage = activePageId ? pages.find(p => p.id === activePageId) ?? null : null;
  const selectedNarrativeGraphId = useWriterWorkspaceStore((state) => state.selectedNarrativeGraphId);
  const dataAdapter = useWriterDataContext();
  const setPages = useWriterWorkspaceStore((state) => state.actions.setPages);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const setContentError = useWriterWorkspaceStore((state) => state.actions.setContentError);

  // Load pages when project or selected narrative graph changes
  useEffect(() => {
    if (!projectId || !dataAdapter) {
      setPages([]);
      setActivePageId(null);
      return;
    }
    if (selectedNarrativeGraphId == null) {
      setPages([]);
      return;
    }
    let cancelled = false;
    dataAdapter.listPages(projectId, selectedNarrativeGraphId).then((pagesData) => {
      if (!cancelled) {
        setPages(pagesData);
      }
    }).catch((error) => {
      console.error('Failed to load writer data:', error);
      if (!cancelled) {
        setContentError('Failed to load data');
      }
    });
    return () => { cancelled = true; };
  }, [projectId, selectedNarrativeGraphId, dataAdapter, setPages, setActivePageId, setContentError]);

  useEffect(() => {
    if (onActivePageChange) {
      onActivePageChange(activePageId ?? null);
    }
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
