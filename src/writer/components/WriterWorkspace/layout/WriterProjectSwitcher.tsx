'use client';

import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { getPlainTextFromSerializedContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';
import { useMemo } from 'react';

interface WriterProjectSwitcherProps {
  selectedProjectId: number | null;
  onProjectChange: (projectId: number | null) => void;
}

/**
 * ProjectSwitcher with File/View menus for Writer workspace
 * This component accesses the WriterWorkspace store to provide download and view controls
 */
export function WriterProjectSwitcher({ selectedProjectId, onProjectChange }: WriterProjectSwitcherProps) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageMap = useWriterWorkspaceStore((state) => state.pageMap);
  const drafts = useWriterWorkspaceStore((state) => state.drafts);
  const pageLayout = useWriterWorkspaceStore((state) => state.pageLayout);
  const togglePageFullWidth = useWriterWorkspaceStore((state) => state.actions.togglePageFullWidth);

  const activePage = activePageId ? pageMap.get(activePageId) ?? null : null;
  const draft = activePageId ? drafts[activePageId] ?? null : null;
  const draftTitle = activePageId ? drafts[activePageId]?.title ?? '' : '';
  const pageContent = draft?.content.plainText ?? getPlainTextFromSerializedContent(activePage?.bookBody) ?? '';
  const isFullWidth = activePageId
    ? pageLayout.fullWidthByPageId[activePageId] ?? false
    : false;

  const writerMenus = useMemo(() => {
    const downloadAsMarkdown = () => {
      const title = draftTitle.trim() || activePage?.title || 'Untitled';
      const blob = new Blob([pageContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const downloadAsPDF = () => {
      const title = draftTitle.trim() || activePage?.title || 'Untitled';
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1, h2, h3 { margin-top: 20px; }
              p { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <pre style="white-space: pre-wrap; font-family: inherit;">${pageContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    return {
      onDownloadMarkdown: downloadAsMarkdown,
      onDownloadPDF: downloadAsPDF,
      onToggleFullWidth: () => {
        if (activePageId) {
          togglePageFullWidth(activePageId);
        }
      },
      isFullWidth,
      canDownload: !!(activePageId && pageContent),
    };
  }, [activePageId, activePage, draftTitle, pageContent, isFullWidth, togglePageFullWidth]);

  return (
    <ProjectSwitcher
      selectedProjectId={selectedProjectId}
      onProjectChange={onProjectChange}
      writerMenus={writerMenus}
    />
  );
}
