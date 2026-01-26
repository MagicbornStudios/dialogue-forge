import React, { useMemo, useRef, useState, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import DragDropPaste from './lexical/plugins/DragDropPastePlugin/index';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor as LexicalEditorType } from 'lexical';
import { writerNodes } from '@/writer/components/WriterWorkspace/editor/lexical/nodes';
import { writerTheme } from '@/writer/components/WriterWorkspace/editor/lexical/theme';
import { WriterEditorSessionProvider, createWriterEditorSessionStore } from '@/writer/components/WriterWorkspace/editor/hooks/useWriterEditorSession';
import type { WriterDraftContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';
import { SettingsProvider } from './lexical/context/SettingsContext';
import ToolbarPlugin from './lexical/plugins/ToolbarPlugin/index';
import ShortcutsPlugin from './lexical/plugins/ShortcutsPlugin';
import ComponentPickerPlugin from './lexical/plugins/ComponentPickerPlugin';
import EmojiPickerPlugin from './lexical/plugins/EmojiPickerPlugin';
import AutoEmbedPlugin from './lexical/plugins/AutoEmbedPlugin';
import MentionsPlugin from './lexical/plugins/MentionsPlugin';
import EmojisPlugin from './lexical/plugins/EmojisPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import KeywordsPlugin from './lexical/plugins/KeywordsPlugin';
import SpeechToTextPlugin from './lexical/plugins/SpeechToTextPlugin';
import AutoLinkPlugin from './lexical/plugins/AutoLinkPlugin';
import DateTimePlugin from './lexical/plugins/DateTimePlugin';
import MarkdownShortcutPlugin from './lexical/plugins/MarkdownShortcutPlugin';
import CodeHighlightPrismPlugin from './lexical/plugins/CodeHighlightPrismPlugin';
import { TablePlugin as LexicalTablePlugin } from '@lexical/react/LexicalTablePlugin';
import TableCellResizerPlugin from './lexical/plugins/TableCellResizer';
import TableScrollShadowPlugin from './lexical/plugins/TableScrollShadowPlugin';
import ImagesPlugin from './lexical/plugins/ImagesPlugin';
import LinkPlugin from './lexical/plugins/LinkPlugin';
import PollPlugin from './lexical/plugins/PollPlugin';
import TwitterPlugin from './lexical/plugins/TwitterPlugin';
import YouTubePlugin from './lexical/plugins/YouTubePlugin';
import FigmaPlugin from './lexical/plugins/FigmaPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import EquationsPlugin from './lexical/plugins/EquationsPlugin';
import ExcalidrawPlugin from './lexical/plugins/ExcalidrawPlugin';
import TabFocusPlugin from './lexical/plugins/TabFocusPlugin';
import CollapsiblePlugin from './lexical/plugins/CollapsiblePlugin';
import PageBreakPlugin from './lexical/plugins/PageBreakPlugin';
import { LayoutPlugin } from './lexical/plugins/LayoutPlugin/LayoutPlugin';
import FloatingLinkEditorPlugin from './lexical/plugins/FloatingLinkEditorPlugin';
import TableActionMenuPlugin from './lexical/plugins/TableActionMenuPlugin';
import DraggableBlockPlugin from './lexical/plugins/DraggableBlockPlugin';
import CodeActionMenuPlugin from './lexical/plugins/CodeActionMenuPlugin';
import TableHoverActionsV2Plugin from './lexical/plugins/TableHoverActionsV2Plugin';
import FloatingTextFormatToolbarPlugin from './lexical/plugins/FloatingTextFormatToolbarPlugin';
import ActionsPlugin from './lexical/plugins/ActionsPlugin';
import ContentEditable from './lexical/ui/ContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { CAN_USE_DOM } from '@lexical/utils';

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

function EditorContent({
  placeholder = 'Enter some rich text...',
  onChange,
}: {
  placeholder?: string;
  onChange?: (value: WriterDraftContent) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false);
  const isEditable = useLexicalEditable();

  const onRef = (floatingAnchorElem: HTMLDivElement) => {
    if (floatingAnchorElem !== null) {
      setFloatingAnchorElem(floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

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
      <div className="editor-container">
        <DragDropPaste />
        <AutoFocusPlugin />
        <ComponentPickerPlugin />
        <EmojiPickerPlugin />
        <AutoEmbedPlugin />
        <MentionsPlugin />
        <EmojisPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <SpeechToTextPlugin />
        <AutoLinkPlugin />
        <DateTimePlugin />
        <HistoryPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor" ref={onRef}>
                <ContentEditable placeholder={placeholder} />
              </div>
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
        <MarkdownShortcutPlugin />
        <CodeHighlightPrismPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LexicalTablePlugin />
        <TableCellResizerPlugin />
        <TableScrollShadowPlugin />
        <ImagesPlugin />
        <LinkPlugin />
        <PollPlugin />
        <TwitterPlugin />
        <YouTubePlugin />
        <FigmaPlugin />
        <ClickableLinkPlugin disabled={!isEditable} />
        <HorizontalRulePlugin />
        <EquationsPlugin />
        <ExcalidrawPlugin />
        <TabFocusPlugin />
        <TabIndentationPlugin maxIndent={7} />
        {/* <CollapsiblePlugin /> */}
        {/* <PageBreakPlugin /> */}
        {/* <LayoutPlugin /> */}
        {floatingAnchorElem && (
          <>
            <FloatingLinkEditorPlugin
              anchorElem={floatingAnchorElem}
              isLinkEditMode={isLinkEditMode}
              setIsLinkEditMode={setIsLinkEditMode}
            />
            <TableActionMenuPlugin
              anchorElem={floatingAnchorElem}
              cellMerge={true}
            />
          </>
        )}
        {floatingAnchorElem && !isSmallWidthViewport && (
          <>
            <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
            <TableHoverActionsV2Plugin anchorElem={floatingAnchorElem} />
            <FloatingTextFormatToolbarPlugin
              anchorElem={floatingAnchorElem}
              setIsLinkEditMode={setIsLinkEditMode}
            />
          </>
        )}
        <ActionsPlugin
          shouldPreserveNewLinesInMarkdown={false}
          useCollabV2={false}
        />
      </div>
    </>
  );
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
        <SettingsProvider>
          <LexicalComposer initialConfig={initialConfig}>
            <EditorContent placeholder={placeholder} onChange={onChange} />
          </LexicalComposer>
        </SettingsProvider>
      </WriterEditorSessionProvider>
    </div>
  );
}
