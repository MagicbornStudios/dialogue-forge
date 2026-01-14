import React, { useEffect, useState } from 'react';
import {
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, $isListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useWriterWorkspaceStore } from '../../../store/writer-workspace-store';

const toolbarButtonBase =
  'rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary transition hover:text-df-text-primary';

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [hasSelection, setHasSelection] = useState(false);
  const setAiSelection = useWriterWorkspaceStore((state) => state.actions.setAiSelection);
  const proposeAiEdits = useWriterWorkspaceStore((state) => state.actions.proposeAiEdits);

  const onToggleList = () => {
    editor.update(() => {
      const selection = $getSelection();
      const isInList =
        $isRangeSelection(selection) &&
        selection
          .getNodes()
          .some((node) => {
            const parent = node.getParent();
            return $isListNode(node) || (parent ? $isListNode(parent) : false);
          });
      editor.dispatchCommand(
        isInList ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
        undefined
      );
    });
  };

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        const text = $isRangeSelection(selection)
          ? selection.getTextContent()
          : '';
        setHasSelection(Boolean(text));
      });
    });
  }, [editor]);

  const onRewriteSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setAiSelection(null);
        return;
      }
      const selectionText = selection.getTextContent();
      const fullText = $getRoot().getTextContent();
      if (!selectionText) {
        setAiSelection(null);
        return;
      }
      const start = fullText.indexOf(selectionText);
      if (start === -1) {
        setAiSelection(null);
        return;
      }
      setAiSelection({ start, end: start + selectionText.length });
    });

    void proposeAiEdits();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-df-node-border px-3 py-2">
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        aria-label="Bold"
      >
        Bold
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        aria-label="Italic"
      >
        Italic
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h1' as any)}
        aria-label="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={onToggleList}
        aria-label="List"
      >
        List
      </button>
      <button
        type="button"
        className={`${toolbarButtonBase} ${hasSelection ? '' : 'opacity-50'}`}
        onClick={onRewriteSelection}
        disabled={!hasSelection}
        aria-label="Rewrite selection"
      >
        Rewrite selection
      </button>
    </div>
  );
}
