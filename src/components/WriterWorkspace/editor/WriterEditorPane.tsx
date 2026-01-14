import React, { useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import {
  useWriterWorkspaceStore,
  WRITER_SAVE_STATUS,
} from '../store/writer-workspace-store';
import { LexicalEditor } from './LexicalEditor';
import { AutosavePlugin } from './lexical/plugins/AutosavePlugin';

interface WriterEditorPaneProps {
  className?: string;
}

export function WriterEditorPane({ className }: WriterEditorPaneProps) {
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const draft = useWriterWorkspaceStore((state) =>
    activePageId ? state.drafts[activePageId] ?? null : null
  );
  const setDraftTitle = useWriterWorkspaceStore((state) => state.actions.setDraftTitle);
  const setDraftContent = useWriterWorkspaceStore((state) => state.actions.setDraftContent);
  const saveNow = useWriterWorkspaceStore((state) => state.actions.saveNow);

  const activePage = pages.find((page) => page.id === activePageId) ?? null;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!activePageId) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveNow(activePageId);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activePageId, saveNow]);

  const saveStatus = useMemo(() => {
    if (!draft) {
      return { label: 'Saved', tone: 'text-df-text-tertiary' };
    }
    switch (draft.status) {
      case WRITER_SAVE_STATUS.DIRTY:
        return { label: 'Unsaved', tone: 'text-amber-400' };
      case WRITER_SAVE_STATUS.SAVING:
        return { label: 'Saving', tone: 'text-df-text-secondary' };
      case WRITER_SAVE_STATUS.ERROR:
        return { label: 'Error', tone: 'text-red-400' };
      case WRITER_SAVE_STATUS.SAVED:
      default:
        return { label: 'Saved', tone: 'text-emerald-400' };
    }
  }, [draft]);

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between rounded-lg border border-df-node-border bg-df-editor-bg px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText size={14} className="text-df-text-tertiary" />
          <input
            type="text"
            className="w-full bg-transparent text-sm font-medium text-df-text-primary outline-none placeholder:text-df-text-tertiary"
            placeholder={activePage ? 'Untitled page' : 'Select a page'}
            value={draft?.title ?? activePage?.title ?? ''}
            onChange={(event) => {
              if (!activePageId) {
                return;
              }
              setDraftTitle(activePageId, event.target.value);
            }}
            disabled={!activePageId}
          />
        </div>
        <span
          className={`rounded-full border border-df-control-border px-3 py-1 text-[11px] uppercase tracking-wide ${saveStatus.tone}`}
        >
          {saveStatus.label}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-df-node-border bg-df-editor-bg">
        {activePage ? (
          <>
            <LexicalEditor
              key={activePage.id}
              value={draft?.content ?? activePage.bookBody ?? ''}
              placeholder="Start writing..."
              onChange={(nextValue) => {
                if (!activePageId) {
                  return;
                }
                setDraftContent(activePageId, nextValue);
              }}
            />
            <AutosavePlugin />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-df-text-tertiary">
            Choose a page from the outline to start writing.
          </div>
        )}
      </div>
    </div>
  );
}
