/**
 * PageContentPlugin
 * 
 * Updates editor state when the active page changes.
 * Ensures the editor displays the correct content for each page.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { useEditorSyncContext } from '../../context/EditorSyncContext';

export default function PageContentPlugin(): null {
  const { pageId, pageContent } = useEditorSyncContext();
  const [editor] = useLexicalComposerContext();
  const lastPageIdRef = useRef<number | null>(null);
  const lastContentRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update if page actually changed
    if (pageId === lastPageIdRef.current && pageContent === lastContentRef.current) {
      return;
    }

    // If pageId changed, always update the editor (even if content is null/undefined)
    if (!pageId) {
      lastPageIdRef.current = null;
      lastContentRef.current = null;
      return;
    }

    // If page changed, update the editor with new content (or empty if no content)
    try {
      if (pageContent && pageContent.trim() !== '') {
        // Parse and set the new editor state
        try {
          const editorState = editor.parseEditorState(pageContent);
          editor.setEditorState(editorState);
        } catch (parseError) {
          console.error('Error parsing editor state:', parseError);
          // If parsing fails, clear editor to empty state
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          }, { discrete: true });
        }
      } else {
        // If no content or empty string, clear the editor to empty state
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }, { discrete: true });
      }
      
      // Update refs
      lastPageIdRef.current = pageId;
      lastContentRef.current = pageContent ?? null;
    } catch (error) {
      console.error('Error updating editor state for page:', error);
    }
  }, [editor, pageId, pageContent]);

  return null;
}
