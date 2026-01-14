import React from 'react';
import { FileText } from 'lucide-react';
import { useWriterWorkspaceStore } from '../store/writer-workspace-store';
import { LexicalEditor } from './LexicalEditor';

interface WriterEditorPaneProps {
  className?: string;
}

export function WriterEditorPane({ className }: WriterEditorPaneProps) {
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const updatePage = useWriterWorkspaceStore((state) => state.actions.updatePage);

  const activePage = pages.find((page) => page.id === activePageId) ?? null;

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between rounded-lg border border-df-node-border bg-df-editor-bg px-3 py-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
          <FileText size={14} />
          {activePage ? activePage.title : 'Select a page'}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-df-node-border bg-df-editor-bg">
        {activePage ? (
          <LexicalEditor
            key={activePage.id}
            value={activePage.bookBody ?? ''}
            placeholder="Start writing..."
            onChange={(nextValue) => updatePage(activePage.id, { bookBody: nextValue })}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-df-text-tertiary">
            Choose a page from the outline to start writing.
          </div>
        )}
      </div>
    </div>
  );
}
