import React, { useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { writerNodes } from '@/writer/components/WriterWorkspace/editor/lexical/nodes';
import { ToolbarPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/ToolbarPlugin';
import { writerTheme } from '@/writer/components/WriterWorkspace/editor/lexical/theme';
import { AiSelectionPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/AiSelectionPlugin';
import { CopilotKitPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/CopilotKitPlugin';
import { WriterEditorSessionProvider, createWriterEditorSessionStore } from '@/writer/components/WriterWorkspace/editor/hooks/useWriterEditorSession';

interface LexicalEditorProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function LexicalEditor({
  value = '',
  placeholder = 'Write here...',
  onChange,
  className,
}: LexicalEditorProps) {
  const initialValueRef = useRef(value);
  const sessionStoreRef = useRef(createWriterEditorSessionStore());

  const initialConfig = useMemo(() => ({
    namespace: 'WriterEditor',
    theme: writerTheme,
    nodes: writerNodes,
    onError: (error: Error) => {
      throw error;
    },
    editorState: () => {
      if (!initialValueRef.current) {
        return;
      }
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(initialValueRef.current));
      root.append(paragraph);
    },
  }), []);

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className ?? ''}`}>
      <WriterEditorSessionProvider store={sessionStoreRef.current}>
        <LexicalComposer initialConfig={initialConfig}>
          <div className="flex min-h-0 flex-1 flex-col">
            <ToolbarPlugin />
            <AiSelectionPlugin />
            <CopilotKitPlugin />
            <div className="relative flex min-h-0 flex-1 flex-col">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="min-h-[240px] flex-1 px-4 py-4 text-sm text-df-text-primary outline-none" />
              }
              placeholder={
                <div className="pointer-events-none absolute left-4 top-4 text-sm text-df-text-tertiary">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <OnChangePlugin
              onChange={(editorState) => {
                if (!onChange) {
                  return;
                }
                editorState.read(() => {
                  onChange($getRoot().getTextContent());
                });
              }}
            />
          </div>
        </div>
      </LexicalComposer>
      </WriterEditorSessionProvider>
    </div>
  );
}
