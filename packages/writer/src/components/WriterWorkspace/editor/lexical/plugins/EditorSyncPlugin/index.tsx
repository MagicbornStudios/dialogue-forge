/**
 * EditorSyncPlugin
 * 
 * Syncs Lexical editor content changes to the workspace store.
 * Debounces updates to avoid excessive store writes.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $rootTextContent } from '@lexical/text';
import { COLLABORATION_TAG, HISTORIC_TAG } from 'lexical';
import { useEffect, useRef } from 'react';
import { useEditorSyncContext } from '../../context/EditorSyncContext';
import { COMMENT_DELETION_TAG } from '../CommentPlugin';

export default function EditorSyncPlugin({
  debounceMs = 300,
}: {
  debounceMs?: number;
}): null {
  const { pageId, onContentChange } = useEditorSyncContext();
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSerializedRef = useRef<string>('');

  useEffect(() => {
    if (!pageId) {
      return;
    }

    // Reset lastSerializedRef when pageId changes to ensure first update is captured
    lastSerializedRef.current = '';

    const handleUpdate = ({ editorState, tags }: { editorState: any; tags: Set<string> }) => {
      // Skip updates from collaboration, history (undo/redo), or comment deletion
      if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG) || tags.has(COMMENT_DELETION_TAG)) {
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the update
      timeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          try {
            const serialized = JSON.stringify(editorState.toJSON());
            
            // Only update if content actually changed
            if (serialized !== lastSerializedRef.current) {
              lastSerializedRef.current = serialized;
              
              // Extract plain text
              const plainText = $rootTextContent();
              
              // Call the callback to update the store
              onContentChange(pageId, {
                serialized,
                plainText,
              });
            }
          } catch (error) {
            console.error('Error syncing editor content to store:', error);
          }
        });
      }, debounceMs);
    };

    const removeUpdateListener = editor.registerUpdateListener(handleUpdate);

    return () => {
      removeUpdateListener();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, pageId, onContentChange, debounceMs]);

  return null;
}
