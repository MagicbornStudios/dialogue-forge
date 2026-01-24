// src/components/WriterWorkspace/WriterWorkspace.tsx
import React, { useRef, useEffect } from 'react';
import type { ForgePage } from '@/shared/types/narrative';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@/writer/types/forge-data-adapter';
import type { WriterEvent } from '@/writer/events/writer-events';
import { FORGE_GRAPH_KIND } from '@/shared/types/forge-graph';
import {
  WriterWorkspaceStoreProvider,
  createWriterWorkspaceStore,
  useWriterWorkspaceStore,
} from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { setupWriterWorkspaceSubscriptions } from '@/writer/components/WriterWorkspace/store/slices/subscriptions';
import { WriterTree } from '@/writer/components/WriterWorkspace/sidebar/WriterTree';
import { WriterLayout } from '@/writer/components/WriterWorkspace/layout/WriterLayout';
import { WriterEditorPane } from '@/writer/components/WriterWorkspace/editor/WriterEditorPane';
import { WriterWorkspaceModalsRenderer } from '@/writer/components/WriterWorkspace/modals/WriterWorkspaceModals';
import { CopilotKitWorkspaceProvider } from '@/ai/copilotkit/providers/CopilotKitWorkspaceProvider';
import { useWriterWorkspaceActions } from '@/writer/copilotkit';
import { Toaster } from '@/shared/ui/toast';
import { validateNarrativeGraph } from '@/shared/lib/graph-validation';
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
          
          // Validate the selected graph
          const selectedGraph = graphs.find(g => g.id === defaultGraphId);
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

  // Load data when project changes
  useEffect(() => {
    if (!projectId || !dataAdapter) {
      const store = storeRef.current;
      store.getState().actions.setPages([]);
      store.getState().actions.setActivePageId(null);
      return;
    }

    let cancelled = false;
    const store = storeRef.current;

    async function loadData() {
      if (!dataAdapter || !projectId) {
        return;
      }
      try {
        const pagesData = await dataAdapter.listPages(projectId);

        if (!cancelled) {
          store.getState().actions.setPages(pagesData);
        }
      } catch (error) {
        console.error('Failed to load writer data:', error);
        if (!cancelled) {
          store.getState().actions.setContentError('Failed to load data');
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [projectId, dataAdapter]);

  return (
    <>
      <WriterWorkspaceStoreProvider store={storeRef.current}>
        <CopilotKitWorkspaceProvider workspaceStore={storeRef.current}>
          <WriterWorkspaceActionsWrapper store={storeRef.current}>
            <WriterWorkspaceContent
              className={className}
              onActivePageChange={onActivePageChange}
              projectId={projectId}
            />
          </WriterWorkspaceActionsWrapper>
        </CopilotKitWorkspaceProvider>
      </WriterWorkspaceStoreProvider>
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
  // Register workspace actions
  useWriterWorkspaceActions(store);
  return <>{children}</>;
}

function WriterWorkspaceContent({
  className,
  onActivePageChange,
  projectId,
}: Pick<WriterWorkspaceProps, 'className' | 'onActivePageChange' | 'projectId'>) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageMap = useWriterWorkspaceStore((state) => state.pageMap);
  const activePage = activePageId ? pageMap.get(activePageId) ?? null : null;

  useEffect(() => {
    if (onActivePageChange) {
      onActivePageChange(activePageId ?? null);
    }
  }, [activePageId, onActivePageChange]);

  return (
    <>
      <div className={`flex h-full w-full flex-col ${className}`}>
        <WriterLayout
          sidebar={<WriterTree projectId={projectId} />}
          editor={<WriterEditorPane />}
        />
      </div>
      <WriterWorkspaceModalsRenderer activePage={activePage} />
    </>
  );
}
