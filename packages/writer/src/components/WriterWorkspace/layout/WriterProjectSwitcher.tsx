'use client';

import { useWriterDownloadActions } from '@magicborn/writer/hooks/useWriterDownloadActions';

export interface WriterMenuHandlers {
  onDownloadMarkdown?: () => void;
  onDownloadPDF?: () => void;
  onToggleFullWidth?: () => void;
  isFullWidth?: boolean;
  canDownload?: boolean;
}

export interface WriterProjectSwitcherRenderProps {
  selectedProjectId: number | null;
  onProjectChange: (projectId: number | null) => void;
  writerMenus: WriterMenuHandlers;
}

interface WriterProjectSwitcherProps {
  selectedProjectId: number | null;
  onProjectChange: (projectId: number | null) => void;
  renderProjectSwitcher?: (props: WriterProjectSwitcherRenderProps) => React.ReactNode;
}

/**
 * ProjectSwitcher with File/View menus for Writer workspace.
 * Uses useWriterDownloadActions for download and full-width controls.
 */
export function WriterProjectSwitcher({
  selectedProjectId,
  onProjectChange,
  renderProjectSwitcher,
}: WriterProjectSwitcherProps) {
  const {
    downloadAsMarkdown,
    downloadAsPDF,
    activePageId,
    isFullWidth,
    togglePageFullWidth,
    canDownload,
  } = useWriterDownloadActions();

  const writerMenus = {
    onDownloadMarkdown: downloadAsMarkdown,
    onDownloadPDF: downloadAsPDF,
    onToggleFullWidth: () => {
      if (activePageId != null) {
        togglePageFullWidth(activePageId);
      }
    },
    isFullWidth,
    canDownload,
  };
  if (!renderProjectSwitcher) {
    return null;
  }

  return (
    <>
      {renderProjectSwitcher({
        selectedProjectId,
        onProjectChange,
        writerMenus,
      })}
    </>
  );
}
