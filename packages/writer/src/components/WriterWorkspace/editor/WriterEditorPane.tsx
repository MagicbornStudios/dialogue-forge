import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  useWriterWorkspaceStore,
  WRITER_AI_PROPOSAL_STATUS,
  WriterWorkspaceState,
} from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
import { getPlainTextFromSerializedContent } from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-types';
import { applyWriterPatchOps } from '@magicborn/writer/lib/editor/patches';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { SharedHistoryContext } from './lexical/context/SharedHistoryContext';
import { TableContext } from './lexical/plugins/TablePlugin';
import DocsPlugin from './lexical/plugins/DocsPlugin';
import { ToolbarContext } from './lexical/context/ToolbarContext';
import { isDevPlayground } from './lexical/appSettings';
import Editor from './lexical/Editor';
import ToolbarPlugin from './lexical/plugins/ToolbarPlugin';
import ShortcutsPlugin from './lexical/plugins/ShortcutsPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';
import { CollaborationContext, CollaborationContextType } from '@lexical/react/LexicalCollaborationContext';
import { Doc } from 'yjs';
import { JSX } from 'react';
import PlaygroundEditorTheme from './lexical/themes/PlaygroundEditorTheme';
import PlaygroundNodes from './lexical/nodes/PlaygroundNodes';
import { buildHTMLConfig } from './lexical/buildHTMLConfig';
import { useSettings } from './lexical/context/SettingsContext';
import { FlashMessageContext } from './lexical/context/FlashMessageContext';
import { EditorSyncContextProvider } from './lexical/context/EditorSyncContext';
import { CommentContextProvider } from './lexical/context/CommentContext';
import { useUpdateWriterPage } from '@magicborn/writer/data/writer-queries';

interface WriterEditorPaneProps {
  className?: string;
}

function LexicalCollaboration({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [yjsDocMap] = useState(() => new Map<string, Doc>());
  const contextValue: CollaborationContextType = useMemo(
    () => ({
      isCollabActive: false,
      name: '',
      color: '',
      clientID: 0,
      yjsDocMap,
    }),
    [yjsDocMap],
  );

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

function EditorToolbarWrapper() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState<LexicalEditor>(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const { settings: { isRichText } } = useSettings();

  if (!isRichText) {
    return null;
  }

  return (
    <>
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      <ShortcutsPlugin
        editor={activeEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
    </>
  );
}

export function WriterEditorPane({ className }: WriterEditorPaneProps) {
  const pageMap = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.pageMap);
  const pages = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.pages);
  const activePageId = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.activePageId);
  const aiPreview = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiPreview);
  const aiPreviewMeta = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiPreviewMeta);
  const aiProposalStatus = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiProposalStatus);
  const aiError = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiError);
  const aiSnapshot = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiSnapshot);
  const aiUndoSnapshot = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.aiUndoSnapshot);
  const saveNow = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.saveNow);
  const updatePage = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.updatePage);
  const applyAiEdits = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.applyAiEdits);
  const revertAiDraft = useWriterWorkspaceStore((state: WriterWorkspaceState) => state.actions.revertAiDraft);
  const updateWriterPage = useUpdateWriterPage();

  const activePage = activePageId ? pageMap.get(activePageId) ?? null : null;

  const [titleValue, setTitleValue] = useState('');
  useEffect(() => {
    setTitleValue(activePage?.title ?? '');
  }, [activePage?.title, activePageId]);

  const aiPreviewSnapshot = useMemo(() => {
    if (!aiPreview || !aiSnapshot) {
      return null;
    }
    return applyWriterPatchOps(aiSnapshot, aiPreview);
  }, [aiPreview, aiSnapshot]);

  const {
    settings: {isCollab, emptyEditor, measureTypingPerf},
  } = useSettings();

  const initialConfig = useMemo(
    () => ({
      editorState: isCollab
        ? null
        : emptyEditor
          ? undefined
          : (activePage?.bookBody !== undefined && activePage?.bookBody !== null ? activePage.bookBody : '') ?? '',
      html: buildHTMLConfig(),
      namespace: 'Playground',
      nodes: PlaygroundNodes,
      theme: PlaygroundEditorTheme,
      onError: (error: Error) => {
        throw error;
      },
    }),
    [emptyEditor, isCollab, activePage?.bookBody, activePageId],
  );

  const beforeContent = aiSnapshot?.content ?? getPlainTextFromSerializedContent(activePage?.bookBody);
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
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={async () => {
                if (!activePageId || titleValue === (activePage?.title ?? '')) return;
                try {
                  await updateWriterPage.mutateAsync({
                    pageId: activePageId,
                    patch: { title: titleValue.trim() || 'Untitled' },
                  });
                  updatePage(activePageId, { title: titleValue.trim() || 'Untitled' });
                } catch (err) {
                  console.error('Failed to save title', err);
                }
              }}
              disabled={!activePageId}
            />
          </div>
          <span className="rounded-full px-3 py-1 text-[11px] uppercase tracking-wide text-df-text-tertiary">
            Saved
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-row bg-df-editor-bg overflow-hidden relative">
        {activePage ? (
          <>
            <div className="flex min-h-0 flex-[3] flex-col relative overflow-hidden">
              <FlashMessageContext>
                <LexicalCollaboration>
                  <LexicalComposer initialConfig={initialConfig}>
                    <SharedHistoryContext>
                      <TableContext>
                        <ToolbarContext>
                          <EditorToolbarWrapper />
                          <EditorSyncContextProvider
                            pageId={activePageId}
                            onContentChange={() => {}}
                            pageContent={
                              activePage?.bookBody !== undefined && activePage?.bookBody !== null ? activePage.bookBody : null
                            }
                          >
                            <CommentContextProvider
                              pageId={activePageId}
                            >
                              <div className="editor-shell flex min-h-0 flex-1 flex-col overflow-hidden relative">
                                <Editor />
                              </div>
                            </CommentContextProvider>
                          </EditorSyncContextProvider>
                        </ToolbarContext>
                      </TableContext>
                    </SharedHistoryContext>
                  </LexicalComposer>
                </LexicalCollaboration>
              </FlashMessageContext>
            </div>
            <div 
              id="comments-container"
              className="flex-shrink-0 flex-[1] min-w-[300px] max-w-[400px] border-l border-df-control-border bg-df-surface overflow-hidden relative"
            />
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
