import { useEffect } from 'react';
import {
  useWriterWorkspaceStore,
  WRITER_SAVE_STATUS,
} from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

const DEFAULT_AUTOSAVE_DELAY_MS = 1000;

export function AutosavePlugin({ delayMs = DEFAULT_AUTOSAVE_DELAY_MS }: { delayMs?: number }) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const draft = useWriterWorkspaceStore((state) =>
    activePageId ? state.drafts[activePageId] ?? null : null
  );
  const saveNow = useWriterWorkspaceStore((state) => state.actions.saveNow);

  useEffect(() => {
    if (!draft || draft.status !== WRITER_SAVE_STATUS.DIRTY || !activePageId) {
      return undefined;
    }

    const handle = setTimeout(() => {
      void saveNow(activePageId);
    }, delayMs);

    return () => {
      clearTimeout(handle);
    };
  }, [activePageId, delayMs, draft?.revision, draft?.status, saveNow]);

  return null;
}
