/**
 * AutosavePlugin: ephemeral editor, debounced save to page.
 * No draft state - reads from editor and persists via saveNow(pageId, content).
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $rootTextContent } from '@lexical/text';
import { COLLABORATION_TAG, HISTORIC_TAG } from 'lexical';
import { useEffect, useRef } from 'react';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { COMMENT_DELETION_TAG } from './CommentPlugin';

const AUTOSAVE_DEBOUNCE_MS = 2000;

export function AutosavePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const autosaveEnabled = useWriterWorkspaceStore((state) => state.autosaveEnabled);
  const saveNow = useWriterWorkspaceStore((state) => state.actions.saveNow);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSerializedRef = useRef<string>('');
  const autosaveEnabledRef = useRef(autosaveEnabled);
  const activePageIdRef = useRef(activePageId);
  const saveNowRef = useRef(saveNow);

  useEffect(() => {
    autosaveEnabledRef.current = autosaveEnabled;
    activePageIdRef.current = activePageId;
    saveNowRef.current = saveNow;
  }, [autosaveEnabled, activePageId, saveNow]);

  useEffect(() => {
    if (!activePageId) return;
    lastSerializedRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const handleUpdate = ({ editorState, tags }: { editorState: any; tags: Set<string> }) => {
      if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG) || tags.has(COMMENT_DELETION_TAG)) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          try {
            const serialized = JSON.stringify(editorState.toJSON());
            if (serialized === lastSerializedRef.current) return;
            lastSerializedRef.current = serialized;
            const pageId = activePageIdRef.current;
            if (!pageId || !autosaveEnabledRef.current) return;
            const plainText = $rootTextContent();
            saveNowRef.current(pageId, { serialized, plainText });
          } catch (error) {
            console.error('AutosavePlugin:', error);
          }
        });
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    const remove = editor.registerUpdateListener(handleUpdate);
    return () => {
      remove();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [editor, activePageId]);

  return null;
}
