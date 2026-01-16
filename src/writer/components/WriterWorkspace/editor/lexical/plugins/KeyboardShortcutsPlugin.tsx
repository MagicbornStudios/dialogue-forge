import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_NORMAL, FORMAT_TEXT_COMMAND, KEY_DOWN_COMMAND } from 'lexical';

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        if (!(event.metaKey || event.ctrlKey) || event.altKey) {
          return false;
        }

        const key = event.key.toLowerCase();
        if (key === 'b') {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          return true;
        }
        if (key === 'i') {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          return true;
        }
        if (key === 'u') {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );
  }, [editor]);

  return null;
}
