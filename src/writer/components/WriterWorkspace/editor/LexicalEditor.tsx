import React, { useMemo, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor as LexicalEditorType } from 'lexical';
import { writerNodes } from '@/writer/components/WriterWorkspace/editor/lexical/nodes';
import { KeyboardShortcutsPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/KeyboardShortcutsPlugin';
import { ToolbarPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/ToolbarPlugin';
import { WriterPlugins } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/WriterPlugins';
import { writerTheme } from '@/writer/components/WriterWorkspace/editor/lexical/theme';
import { AiSelectionPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/AiSelectionPlugin';
import { CopilotKitPlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/CopilotKitPlugin';
import { WriterEditorSessionProvider, createWriterEditorSessionStore } from '@/writer/components/WriterWorkspace/editor/hooks/useWriterEditorSession';
import type { WriterDraftContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';
import { BlockHandlePlugin } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/BlockHandlePlugin';

const parseSerializedEditorState = (editor: LexicalEditorType, value: string) => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || !('root' in parsed)) {
      return null;
    }
    return editor.parseEditorState(value);
  } catch {
    return null;
  }
};

interface LexicalEditorProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: WriterDraftContent) => void;
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
  const [contentElem, setContentElem] = useState<HTMLDivElement | null>(null);

  const initialConfig = useMemo(() => ({
    namespace: 'WriterEditor',
    theme: writerTheme,
    nodes: writerNodes,
    onError: (error: Error) => {
      throw error;
    },
    editorState: (editor: LexicalEditorType) => {
      if (!initialValueRef.current) {
        return;
      }
      const parsedState = parseSerializedEditorState(editor, initialValueRef.current);
      if (parsedState) {
        editor.setEditorState(parsedState);
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
            {/* ============================================
                PLUGIN DEBUGGING: Start with minimal plugins
                Uncomment plugins one at a time to isolate the issue
                ============================================ */}
            
            {/* Plugin Group 2: Custom UI Plugins - Toolbar at top */}
            <ToolbarPlugin />
            
            {/* Essential plugins - keep these enabled */}
            <div className="relative flex min-h-0 flex-1 flex-col bg-df-editor-bg rounded-b border border-t-0 border-df-editor-border">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    ref={setContentElem}
                    className="min-h-[240px] flex-1 px-4 py-4 text-sm text-df-text-primary outline-none bg-df-editor-bg"
                  />
                }
                placeholder={
                  <div className="pointer-events-none absolute left-4 top-4 text-sm text-df-text-tertiary">
                    {placeholder}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <OnChangePlugin
                onChange={(editorState) => {
                  if (!onChange) {
                    return;
                  }
                  const serializedState = JSON.stringify(editorState.toJSON());
                  editorState.read(() => {
                    onChange({
                      serialized: serializedState,
                      plainText: $getRoot().getTextContent(),
                    });
                  });
                }}
              />
            </div>

            {/* ============================================
                ADD PLUGINS BACK ONE AT A TIME:
                Uncomment each plugin individually and test
                ============================================ */}

            {/* Plugin Group 1: Core Lexical Plugins */}
            <HistoryPlugin />
            {/* <ListPlugin /> */}
            {/* <CheckListPlugin /> */}
            {/* <TabIndentationPlugin /> */}

            {/* Plugin Group 2: Custom UI Plugins */}
            {/* {contentElem ? <BlockHandlePlugin anchorElem={contentElem} /> : null} */}

            {/* Plugin Group 3: AI/Selection Plugins */}
            {/* <AiSelectionPlugin /> */}
            {/* <CopilotKitPlugin /> */}

            {/* Plugin Group 4: Keyboard/Shortcuts */}
            {/* <KeyboardShortcutsPlugin /> */}

            {/* Plugin Group 5: WriterPlugins (contains multiple) */}
            <WriterPlugins />
            {/* 
              WriterPlugins includes:
              - AutoFocusPlugin
              - MediaPlugin
              - ListPlugin (duplicate - already listed above)
              - LinkPlugin
              - MarkdownShortcutPlugin
              - MarkdownPastePlugin
              - SlashCommandPlugin
              - TablePlugin
            */}
          </div>
        </LexicalComposer>
      </WriterEditorSessionProvider>
    </div>
  );
}
