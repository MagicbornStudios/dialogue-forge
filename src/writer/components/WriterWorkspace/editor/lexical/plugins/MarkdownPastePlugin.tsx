import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  RootNode,
} from 'lexical';

const MARKDOWN_HINTS = [
  /^\s{0,3}#{1,6}\s/m,
  /^\s{0,3}(?:\*|-|\+|\d+\.)\s+/m,
  /^\s{0,3}>\s+/m,
  /```[\s\S]*?```/m,
  /`[^`]+`/,
  /\[(.+?)\]\((.+?)\)/,
  /(?:\*\*|__)(?=\S)([\s\S]*?)(?<=\S)(?:\*\*|__)/,
  /(?:\*|_)(?=\S)([\s\S]*?)(?<=\S)(?:\*|_)/,
];

function isMarkdownLike(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  return MARKDOWN_HINTS.some((regex) => regex.test(trimmed));
}

export function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const text = event?.clipboardData?.getData('text/plain') ?? '';
        if (!text || !isMarkdownLike(text)) {
          return false;
        }

        event?.preventDefault();

        editor.update(() => {
          const container = new RootNode();
          $convertFromMarkdownString(text, TRANSFORMERS, container);
          const nodes = container.getChildren();
          if (!nodes.length) {
            return;
          }
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodes);
            return;
          }
          $getRoot().append(...nodes);
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
