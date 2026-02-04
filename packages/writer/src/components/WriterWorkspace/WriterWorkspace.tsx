import React, { useRef, useEffect } from 'react';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@magicborn/writer/types/forge-data-adapter';
import type { WriterEvent } from '@magicborn/writer/events/writer-events';
import { FORGE_GRAPH_KIND } from '@magicborn/shared/types/forge-graph';
import {
  WriterWorkspaceStoreProvider,
  createWriterWorkspaceStore,
  useWriterWorkspaceStore,
} from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
import { setupWriterWorkspaceSubscriptions } from '@magicborn/writer/components/WriterWorkspace/store/slices/subscriptions';
import { WriterTree } from '@magicborn/writer/components/WriterWorkspace/sidebar/WriterTree';
import { WriterLayout } from '@magicborn/writer/components/WriterWorkspace/layout/WriterLayout';
import { WriterEditorPane } from '@magicborn/writer/components/WriterWorkspace/editor/WriterEditorPane';
import { WriterWorkspaceModalsRenderer } from '@magicborn/writer/components/WriterWorkspace/modals/WriterWorkspaceModals';
import { CopilotKitProvider } from '@magicborn/ai/copilotkit/providers/CopilotKitProvider';
import { useWriterWorkspaceActions, useWriterCopilotContext } from '@magicborn/writer/copilotkit';
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
  const eventSinkRef = useRef({
    emit: (event: WriterEvent) => {
      if (onEvent) {
        onEvent(event);
      }
    },
  });

  const storeRef = useRef(
    createWriterWorkspaceStore(
      {
        initialPages: pages,
        initialActivePageId,
        dataAdapter,
        forgeDataAdapter,
      },
      eventSinkRef.current
    )
  );

  React.useEffect(() => {
    setupWriterWorkspaceSubscriptions(storeRef.current, eventSinkRef.current, dataAdapter, forgeDataAdapter);
  }, [dataAdapter, forgeDataAdapter]);

  useEffect(() => {
    const store = storeRef.current;
    store.getState().actions.setPages(pages);
  }, [pages]);

  useEffect(() => {
    storeRef.current.getState().actions.setActivePageId(initialActivePageId ?? null);
  }, [initialActivePageId]);

  // Load all narrative graphs when project changes
  useEffect(() => {
    if (!projectId || !forgeDataAdapter) {
      const store = storeRef.current;
      store.getState().actions.setNarrativeGraphs([]);
      store.getState().actions.setSelectedNarrativeGraphId(null);
      store.getState().actions.setNarrativeGraph(null);
      return;
    }

    let cancelled = false;
    const store = storeRef.current;

    async function loadNarrativeGraphs() {
      if (!forgeDataAdapter || !projectId) {
        return;
      }
      try {
        const project = await forgeDataAdapter.getProject(projectId);
        const graphs = await forgeDataAdapter.listGraphs(projectId, FORGE_GRAPH_KIND.NARRATIVE);
        
        if (!cancelled) {
          store.getState().actions.setNarrativeGraphs(graphs);
          
          // Set default: use project.narrativeGraph if it exists and is in list, otherwise first graph
          const defaultGraphId = project.narrativeGraph && 
            graphs.find(g => g.id === project.narrativeGraph) 
              ? project.narrativeGraph 
              : graphs[0]?.id ?? null;
          
          store.getState().actions.setSelectedNarrativeGraphId(defaultGraphId);
          const selectedGraph = graphs.find(g => g.id === defaultGraphId) ?? null;
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
  }, [projectId, forgeDataAdapter]);

  return (
    <>
      <CopilotKitProvider
        instructions="You are an AI assistant for the Writer workspace. Help users edit and improve their writing."
        defaultOpen={false}
      >
        <WriterWorkspaceStoreProvider store={storeRef.current}>
          <WriterWorkspaceActionsWrapper store={storeRef.current}>
            <WriterWorkspaceContent
              className={className}
              onActivePageChange={onActivePageChange}
              projectId={projectId}
              topBar={topBar}
            />
          </WriterWorkspaceActionsWrapper>
        </WriterWorkspaceStoreProvider>
      </CopilotKitProvider>
      <Toaster />
    </>
  );
}

function WriterWorkspaceActionsWrapper({ 
  children,
  store,
}: { 
  children: React.ReactNode;
  store: ReturnType<typeof createWriterWorkspaceStore>;
}) {
  // Register workspace actions and provide context
  useWriterWorkspaceActions(store);
  useWriterCopilotContext(store);
  return <>{children}</>;
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
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
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
