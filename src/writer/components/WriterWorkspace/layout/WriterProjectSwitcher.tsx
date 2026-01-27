'use client';

import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { getPlainTextFromSerializedContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';
import { convertSerializedContentToMarkdown } from '@/writer/lib/editor/export-utils';
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
  const serializedContent = draft?.content.serialized ?? activePage?.bookBody ?? '';
  const hasContent = !!(serializedContent && serializedContent.trim() && serializedContent !== '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}');
  const isFullWidth = activePageId
    ? pageLayout.fullWidthByPageId[activePageId] ?? false
    : false;

  const writerMenus = useMemo(() => {
    const downloadAsMarkdown = async () => {
      const title = draftTitle.trim() || activePage?.title || 'Untitled';
      const markdown = await convertSerializedContentToMarkdown(serializedContent);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const downloadAsPDF = async () => {
      const title = draftTitle.trim() || activePage?.title || 'Untitled';
      const serializedContent = draft?.content.serialized ?? activePage?.bookBody ?? '';
      const markdown = await convertSerializedContentToMarkdown(serializedContent);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Convert markdown to HTML for better PDF rendering
      const htmlContent = markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/^\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1, h2, h3 { margin-top: 20px; margin-bottom: 10px; }
              h1 { font-size: 2em; }
              h2 { font-size: 1.5em; }
              h3 { font-size: 1.2em; }
              p { margin: 10px 0; }
              strong { font-weight: bold; }
              em { font-style: italic; }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div>${htmlContent}</div>
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
      canDownload: !!(activePageId && hasContent),
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
