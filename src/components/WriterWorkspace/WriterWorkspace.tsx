// src/components/WriterWorkspace/WriterWorkspace.tsx
import React, { useRef, useEffect } from 'react';
import type { ForgeAct, ForgeChapter, ForgePage } from '../../types/narrative';
import {
  WriterWorkspaceStoreProvider,
  createWriterWorkspaceStore,
  useWriterWorkspaceStore,
} from './store/writer-workspace-store';
import { WriterLayout } from './layout/WriterLayout';
import { WriterTree } from './sidebar/WriterTree';
import { WriterEditorPane } from './editor/WriterEditorPane';

interface WriterWorkspaceProps {
  acts?: ForgeAct[];
  chapters?: ForgeChapter[];
  pages?: ForgePage[];
  className?: string;
  initialActivePageId?: number | null;
  onActivePageChange?: (pageId: number | null) => void;
}

export function WriterWorkspace({
  acts = [],
  chapters = [],
  pages = [],
  className = '',
  initialActivePageId = null,
  onActivePageChange,
}: WriterWorkspaceProps) {
  const storeRef = useRef(
    createWriterWorkspaceStore({
      initialActs: acts,
      initialChapters: chapters,
      initialPages: pages,
      initialActivePageId,
    })
  );

  useEffect(() => {
    const store = storeRef.current;
    store.getState().actions.setActs(acts);
    store.getState().actions.setChapters(chapters);
    store.getState().actions.setPages(pages);
  }, [acts, chapters, pages]);

  useEffect(() => {
    storeRef.current.getState().actions.setActivePageId(initialActivePageId ?? null);
  }, [initialActivePageId]);

  return (
    <WriterWorkspaceStoreProvider store={storeRef.current}>
      <WriterWorkspaceContent
        className={className}
        onActivePageChange={onActivePageChange}
      />
    </WriterWorkspaceStoreProvider>
  );
}

function WriterWorkspaceContent({
  className,
  onActivePageChange,
}: Pick<WriterWorkspaceProps, 'className' | 'onActivePageChange'>) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);

  useEffect(() => {
    if (onActivePageChange) {
      onActivePageChange(activePageId ?? null);
    }
  }, [activePageId, onActivePageChange]);

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <WriterLayout
        sidebar={<WriterTree />}
        editor={<WriterEditorPane />}
      />
    </div>
  );
}
