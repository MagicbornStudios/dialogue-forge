import React from 'react';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import { useWriterWorkspaceStore } from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
import { WriterYarnModal } from './components/WriterYarnModal';

interface WriterWorkspaceModalsProps {
  activePage: ForgePage | null;
}

export function WriterWorkspaceModalsRenderer({
  activePage,
}: WriterWorkspaceModalsProps) {
  const modalState = useWriterWorkspaceStore((s) => s.modalState);
  const closeYarnModal = useWriterWorkspaceStore((s) => s.actions.closeYarnModal);

  return (
    <>
      {activePage && (
        <WriterYarnModal
          isOpen={modalState.isYarnModalOpen}
          onClose={closeYarnModal}
          page={activePage}
        />
      )}
    </>
  );
}
