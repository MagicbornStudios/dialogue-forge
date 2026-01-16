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

      {activePage ? (
        <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-df-text-primary">
                AI Patch Preview
              </h3>
              <p className="text-xs text-df-text-tertiary">
                {isLoading
                  ? 'Generating a rewrite preview…'
                  : 'Review changes before applying them to the draft.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-1 text-xs text-df-text-secondary transition hover:text-df-text-primary disabled:opacity-50"
                onClick={revertAiDraft}
                disabled={!aiUndoSnapshot}
              >
                Undo
              </button>
              <button
                type="button"
                className="rounded-md border border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                onClick={applyAiEdits}
                disabled={!hasPreview || isLoading}
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-df-text-secondary md:grid-cols-[1fr,1fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
                Summary
              </div>
              <div className="mt-1 text-sm text-df-text-primary">
                {previewSummary}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
                Rationale
              </div>
              <div className="mt-1 text-sm text-df-text-primary">
                {previewRationale}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
                Risk
              </div>
              <div className="mt-1 text-sm text-df-text-primary">
                {previewRisk}
              </div>
            </div>
            {aiError ? (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 p-2 text-xs text-red-200">
                {aiError}
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-df-control-border bg-df-control-bg p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
                Before
              </div>
              <pre className="mt-2 max-h-48 whitespace-pre-wrap text-xs text-df-text-primary">
                {beforeContent || 'No content to preview.'}
              </pre>
            </div>
            <div className="rounded-md border border-df-control-border bg-df-control-bg p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-df-text-tertiary">
                After
              </div>
              <pre className="mt-2 max-h-48 whitespace-pre-wrap text-xs text-df-text-primary">
                {hasPreview ? afterContent || 'No changes returned.' : 'No preview yet.'}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
