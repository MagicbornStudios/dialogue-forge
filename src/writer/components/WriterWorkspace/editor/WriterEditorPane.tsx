import React, { useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import {
  useWriterWorkspaceStore,
  WRITER_AI_PROPOSAL_STATUS,
  WRITER_SAVE_STATUS,
  WriterWorkspaceState,
} from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { getPlainTextFromSerializedContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';
import { applyWriterPatchOps } from '@/writer/lib/editor/patches';
import { LexicalEditor } from '@/writer/components/WriterWorkspace/editor/LexicalEditor';
import { AutosavePlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/AutosavePlugin';
import { DOM_EVENT_TYPE } from '@/shared/types';

interface WriterEditorPaneProps {
  className?: string;
}

export function WriterEditorPane({ className }: WriterEditorPaneProps) {
  const pages = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.pages);
  const activePageId = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.activePageId);
  
  const draft = useWriterWorkspaceStore((state: WriterWorkspaceState) =>
    activePageId ? state.drafts[activePageId] ?? null : null
  );
  const aiPreview = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiPreview);
  const aiPreviewMeta = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiPreviewMeta);
  const aiProposalStatus = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiProposalStatus);
  const aiError = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiError);
  const aiSnapshot = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiSnapshot);
  const aiUndoSnapshot = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiUndoSnapshot);
  const setDraftTitle = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.setDraftTitle);
  const setDraftContent = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.setDraftContent);
  const saveNow = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.saveNow);
  const applyAiEdits = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.applyAiEdits);
  const revertAiDraft = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.revertAiDraft);

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

    window.addEventListener(DOM_EVENT_TYPE.KEY_DOWN, handler);
    return () => window.removeEventListener(DOM_EVENT_TYPE.KEY_DOWN, handler);
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

  const aiPreviewSnapshot = useMemo(() => {
    if (!aiPreview || !aiSnapshot) {
      return null;
    }
    return applyWriterPatchOps(aiSnapshot, aiPreview);
  }, [aiPreview, aiSnapshot]);

  const beforeContent = aiSnapshot?.content
    ?? draft?.content.plainText
    ?? getPlainTextFromSerializedContent(activePage?.bookBody);
  const afterContent = aiPreviewSnapshot?.content ?? '';
  const hasPreview = Boolean(aiPreview && aiPreview.length > 0);
  const isLoading = aiProposalStatus === WRITER_AI_PROPOSAL_STATUS.LOADING;
  const previewSummary = aiPreviewMeta?.summary ?? 'Awaiting AI preview.';
  const previewRationale =
    aiPreviewMeta?.rationale ??
    'Select text and use “Rewrite selection” to request changes.';
  const previewRisk =
    aiPreviewMeta?.risk ?? 'Review AI edits for accuracy before applying.';

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className ?? ''}`}>
      {activePage && (
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileText size={14} className="text-df-text-tertiary" />
            <input
              type="text"
              className="w-full bg-transparent text-sm font-medium text-df-text-primary outline-none placeholder:text-df-text-tertiary"
              placeholder="Untitled"
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
            className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ${saveStatus.tone}`}
          >
            {saveStatus.label}
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col bg-df-editor-bg">
        {activePage ? (
          <>
            <LexicalEditor
              key={activePageId}
              value={draft?.content.serialized ?? activePage.bookBody ?? ''}
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
