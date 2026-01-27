/**
 * Consolidated AutosavePlugin
 * 
 * Handles both syncing editor content to store AND autosaving to Payload.
 * Single debounce mechanism to prevent conflicts and stuttering.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $rootTextContent } from '@lexical/text';
import { COLLABORATION_TAG, HISTORIC_TAG } from 'lexical';
import { useEffect, useRef } from 'react';
import {
  useWriterWorkspaceStore,
} from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { COMMENT_DELETION_TAG } from './CommentPlugin';

// Debounce for updating store (marking as DIRTY) - increased to reduce stuttering
const STORE_UPDATE_DEBOUNCE_MS = 1500; // 1.5 seconds

// Delay before actually saving to Payload (only if autosave enabled)
const AUTOSAVE_DELAY_MS = 5000; // 5 seconds after typing stops

export function AutosavePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const autosaveEnabled = useWriterWorkspaceStore((state) => state.autosaveEnabled);
  const saveNow = useWriterWorkspaceStore((state) => state.actions.saveNow);
  const setDraftContent = useWriterWorkspaceStore((state) => state.actions.setDraftContent);
  
  const storeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSerializedRef = useRef<string>('');
  const autosaveEnabledRef = useRef(autosaveEnabled);
  const activePageIdRef = useRef(activePageId);
  const saveNowRef = useRef(saveNow);
  const setDraftContentRef = useRef(setDraftContent);

  // Keep refs in sync
  useEffect(() => {
    autosaveEnabledRef.current = autosaveEnabled;
    activePageIdRef.current = activePageId;
    saveNowRef.current = saveNow;
    setDraftContentRef.current = setDraftContent;
  }, [autosaveEnabled, activePageId, saveNow, setDraftContent]);

  useEffect(() => {
    if (!activePageId) {
      return;
    }

    // Reset when page changes
    lastSerializedRef.current = '';
    if (storeUpdateTimeoutRef.current) {
      clearTimeout(storeUpdateTimeoutRef.current);
      storeUpdateTimeoutRef.current = null;
    }
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const handleUpdate = ({ editorState, tags }: { editorState: any; tags: Set<string> }) => {
      // Skip updates from collaboration, history (undo/redo), or comment deletion
      if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG) || tags.has(COMMENT_DELETION_TAG)) {
        return;
      }

      // Clear existing timeouts
      if (storeUpdateTimeoutRef.current) {
        clearTimeout(storeUpdateTimeoutRef.current);
      }
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      // Debounce store update (marks draft as DIRTY)
      storeUpdateTimeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          try {
            const serialized = JSON.stringify(editorState.toJSON());
            
            // Only update if content actually changed
            if (serialized !== lastSerializedRef.current) {
              lastSerializedRef.current = serialized;
              
              // Extract plain text
              const plainText = $rootTextContent();
              
              // Update store (marks as DIRTY)
              const currentPageId = activePageIdRef.current;
              if (currentPageId) {
                setDraftContentRef.current(currentPageId, {
                  serialized,
                  plainText,
                });

                // If autosave is enabled, set up the save timer
                if (autosaveEnabledRef.current) {
                  // Clear any existing autosave timer
                  if (autosaveTimeoutRef.current) {
                    clearTimeout(autosaveTimeoutRef.current);
                  }

                  // Set up autosave timer (5 seconds after store update)
                  // saveNow will check internally if draft is dirty and still the active page
                  autosaveTimeoutRef.current = setTimeout(() => {
                    const pageIdToSave = activePageIdRef.current;
                    if (pageIdToSave && autosaveEnabledRef.current) {
                      void saveNowRef.current(pageIdToSave);
                    }
                  }, AUTOSAVE_DELAY_MS);
                }
              }
            }
          } catch (error) {
            console.error('Error syncing editor content:', error);
          }
        });
      }, STORE_UPDATE_DEBOUNCE_MS);
    };

    const removeUpdateListener = editor.registerUpdateListener(handleUpdate);

    return () => {
      removeUpdateListener();
      if (storeUpdateTimeoutRef.current) {
        clearTimeout(storeUpdateTimeoutRef.current);
      }
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [editor, activePageId]);

  return null;
}
