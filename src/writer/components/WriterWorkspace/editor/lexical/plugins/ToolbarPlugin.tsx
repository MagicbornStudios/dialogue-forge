import React, { useEffect, useState } from 'react';
import {
  CLEAR_FORMATTING_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  type LexicalNode,
} from 'lexical';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

const toolbarButtonBase =
  'rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary transition hover:text-df-text-primary';

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [hasSelection, setHasSelection] = useState(false);
  const setAiSelection = useWriterWorkspaceStore((state) => state.actions.setAiSelection);
  const proposeAiEdits = useWriterWorkspaceStore((state) => state.actions.proposeAiEdits);

  const getListType = (node: LexicalNode | null) => {
    let currentNode: LexicalNode | null = node;
    while (currentNode) {
      if ($isListNode(currentNode)) {
        return currentNode.getListType();
      }
      currentNode = currentNode.getParent();
    }
    return null;
  };

  const toggleList = (
    listType: 'bullet' | 'number' | 'check',
    command:
      | typeof INSERT_UNORDERED_LIST_COMMAND
      | typeof INSERT_ORDERED_LIST_COMMAND
      | typeof INSERT_CHECK_LIST_COMMAND
  ) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      const isInList = selection
        .getNodes()
        .some((node) => getListType(node) === listType);
      editor.dispatchCommand(isInList ? REMOVE_LIST_COMMAND : command, undefined);
    });
  };

  const onToggleBulletList = () => toggleList('bullet', INSERT_UNORDERED_LIST_COMMAND);
  const onToggleOrderedList = () => toggleList('number', INSERT_ORDERED_LIST_COMMAND);
  const onToggleChecklist = () => toggleList('check', INSERT_CHECK_LIST_COMMAND);

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
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        aria-label="Underline"
      >
        Underline
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        aria-label="Strikethrough"
      >
        Strike
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        aria-label="Inline code"
      >
        Inline code
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
        aria-label="Subscript"
      >
        Sub
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}
        aria-label="Superscript"
      >
        Super
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
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h2' as any)}
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'h3' as any)}
        aria-label="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={onToggleBulletList}
        aria-label="Bulleted list"
      >
        Bullets
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={onToggleOrderedList}
        aria-label="Ordered list"
      >
        Ordered
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={onToggleChecklist}
        aria-label="Checklist"
      >
        Checklist
      </button>
      <button
        type="button"
        className={toolbarButtonBase}
        onClick={() => editor.dispatchCommand(CLEAR_FORMATTING_COMMAND, undefined)}
        aria-label="Clear formatting"
      >
        Clear
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
