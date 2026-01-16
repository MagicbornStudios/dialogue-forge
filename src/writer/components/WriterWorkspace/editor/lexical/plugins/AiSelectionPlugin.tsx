import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $getRoot } from 'lexical';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { useWriterEditorSessionStore } from '@/writer/components/WriterWorkspace/editor/hooks/useWriterEditorSession';

export function AiSelectionPlugin() {
  const [editor] = useLexicalComposerContext();
  const setAiSelection = useWriterWorkspaceStore((state) => state.actions.setAiSelection);
  const sessionStore = useWriterEditorSessionStore();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setAiSelection(null);
          sessionStore.setState({ selectedText: null, cursorPosition: null });
          return;
        }

        const selectedText = selection.getTextContent();
        const root = $getRoot();
        const fullText = root.getTextContent();
        
        if (!selectedText) {
          setAiSelection(null);
          sessionStore.setState({ selectedText: null, cursorPosition: null });
          return;
        }

        // Calculate start/end positions
        const start = fullText.indexOf(selectedText);
        if (start === -1) {
          setAiSelection(null);
          return;
        }

        const selectionSnapshot = {
          start,
          end: start + selectedText.length,
          text: selectedText,
        };

        setAiSelection(selectionSnapshot);
        sessionStore.setState({
          selectedText,
          cursorPosition: { line: 0, column: start },
        });
      });
    });
  }, [editor, setAiSelection, sessionStore]);

  return null;
}
