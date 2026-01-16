import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCopilotReadable } from '@copilotkit/react-core';
import { $getRoot } from 'lexical';

export function CopilotKitPlugin() {
  const [editor] = useLexicalComposerContext();

  // Make editor content readable to CopilotKit
  useCopilotReadable({
    description: 'Current editor content',
    value: () => {
      return editor.getEditorState().read(() => {
        return $getRoot().getTextContent();
      });
    },
  });

  return null;
}
