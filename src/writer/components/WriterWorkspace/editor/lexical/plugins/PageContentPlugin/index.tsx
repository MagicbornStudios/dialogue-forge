/**
 * PageContentPlugin
 * 
 * Updates editor state when the active page changes.
 * Ensures the editor displays the correct content for each page.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
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

    // Skip if no page or no content
    if (!pageId || !pageContent) {
      lastPageIdRef.current = pageId;
      lastContentRef.current = pageContent ?? null;
      return;
    }

    try {
      // Parse and set the new editor state
      const editorState = editor.parseEditorState(pageContent);
      editor.setEditorState(editorState);
      
      // Update refs
      lastPageIdRef.current = pageId;
      lastContentRef.current = pageContent;
    } catch (error) {
      console.error('Error updating editor state for page:', error);
    }
  }, [editor, pageId, pageContent]);

  return null;
}
