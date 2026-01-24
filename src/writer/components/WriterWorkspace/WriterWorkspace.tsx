// src/components/WriterWorkspace/WriterWorkspace.tsx
import React, { useRef, useEffect } from 'react';
import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { WriterEvent } from '@/writer/events/writer-events';
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

interface WriterWorkspaceProps {
  acts?: ForgeAct[];
  chapters?: ForgeChapter[];
  pages?: ForgePage[];
  className?: string;
  initialActivePageId?: number | null;
  onActivePageChange?: (pageId: number | null) => void;
  onEvent?: (event: WriterEvent) => void;
  dataAdapter?: WriterDataAdapter;
  projectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
}

export function WriterWorkspace({
  acts = [],
  chapters = [],
  pages = [],
  className = '',
  initialActivePageId = null,
  onActivePageChange,
  onEvent,
  dataAdapter,
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
        initialActs: acts,
        initialChapters: chapters,
        initialPages: pages,
        initialActivePageId,
        dataAdapter,
      },
      eventSinkRef.current
    )
  );

  React.useEffect(() => {
    setupWriterWorkspaceSubscriptions(storeRef.current, eventSinkRef.current, dataAdapter);
  }, [dataAdapter]);

  useEffect(() => {
    const store = storeRef.current;
    store.getState().actions.setActs(acts);
    store.getState().actions.setChapters(chapters);
    store.getState().actions.setPages(pages);
  }, [acts, chapters, pages]);

  useEffect(() => {
    storeRef.current.getState().actions.setActivePageId(initialActivePageId ?? null);
  }, [initialActivePageId]);

  // Load data when project changes
  useEffect(() => {
    if (!projectId || !dataAdapter) {
      const store = storeRef.current;
      store.getState().actions.setActs([]);
      store.getState().actions.setChapters([]);
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
        const [actsData, chaptersData, pagesData] = await Promise.all([
          dataAdapter.listActs(projectId),
          dataAdapter.listChapters(projectId),
          dataAdapter.listPages(projectId),
        ]);

        if (!cancelled) {
          store.getState().actions.setActs(actsData);
          store.getState().actions.setChapters(chaptersData);
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
    <WriterWorkspaceStoreProvider store={storeRef.current}>
      <CopilotKitWorkspaceProvider workspaceStore={storeRef.current}>
        <WriterWorkspaceActionsWrapper store={storeRef.current}>
          <WriterWorkspaceContent
            className={className}
            onActivePageChange={onActivePageChange}
          />
        </WriterWorkspaceActionsWrapper>
      </CopilotKitWorkspaceProvider>
    </WriterWorkspaceStoreProvider>
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
}: Pick<WriterWorkspaceProps, 'className' | 'onActivePageChange'>) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePage = activePageId ? pages.find((p) => p.id === activePageId) ?? null : null;

  useEffect(() => {
    if (onActivePageChange) {
      onActivePageChange(activePageId ?? null);
    }
  }, [activePageId, onActivePageChange]);

  return (
    <>
      <div className={`flex h-full w-full flex-col ${className}`}>
        <WriterLayout
          sidebar={<WriterTree />}
          editor={<WriterEditorPane />}
        />
      </div>
      <WriterWorkspaceModalsRenderer activePage={activePage} />
    </>
  );
}
