'use client';

import { useCallback } from 'react';
import { useWriterWorkspaceStore } from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
import { convertSerializedContentToMarkdown } from '@magicborn/writer/lib/editor/export-utils';

const EMPTY_EDITOR_JSON =
  '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

function markdownToSimpleHtml(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/^\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

/**
 * Shared hook for Writer download (Markdown/PDF) and full-width toggle.
 * Used by WriterTopBar and WriterProjectSwitcher to avoid duplicated logic.
 */
export function useWriterDownloadActions() {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageMap = useWriterWorkspaceStore((state) => state.pageMap);
  const pageLayout = useWriterWorkspaceStore((state) => state.pageLayout);
  const togglePageFullWidth = useWriterWorkspaceStore((state) => state.actions.togglePageFullWidth);

  const activePage = activePageId ? pageMap.get(activePageId) ?? null : null;
  const serializedContent = activePage?.bookBody ?? '';
  const hasContent = !!(
    serializedContent &&
    serializedContent.trim() &&
    serializedContent !== EMPTY_EDITOR_JSON
  );
  const isFullWidth =
    activePageId != null ? (pageLayout.fullWidthByPageId[activePageId] ?? false) : false;

  const downloadAsMarkdown = useCallback(async () => {
    const title = (activePage?.title ?? '').trim() || 'Untitled';
    const markdown = await convertSerializedContentToMarkdown(serializedContent);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activePage?.title, serializedContent]);

  const downloadAsPDF = useCallback(async () => {
    const title = (activePage?.title ?? '').trim() || 'Untitled';
    const markdown = await convertSerializedContentToMarkdown(serializedContent);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const htmlContent = markdownToSimpleHtml(markdown);
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
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div>${htmlContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }, [activePage?.title, serializedContent]);

  return {
    downloadAsMarkdown,
    downloadAsPDF,
    hasContent,
    activePageId,
    activePage,
    isFullWidth,
    togglePageFullWidth,
    canDownload: !!(activePageId && hasContent),
  };
}
