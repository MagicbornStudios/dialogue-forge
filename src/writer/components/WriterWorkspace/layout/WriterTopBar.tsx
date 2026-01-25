import React from 'react';
import { FileText, File, Maximize2, Minimize2, Download, Folder, Eye } from 'lucide-react';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  MenubarCheckboxItem,
} from '@/shared/ui/menubar';
import { getPlainTextFromSerializedContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';

export function WriterTopBar() {
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
    
    // Create a temporary window for printing
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

  return (
    <div className="w-full flex items-center justify-between px-6 py-2.5 border-b border-df-node-border/30">
      {/* Left: File menu */}
      <Menubar className="border-0 bg-transparent p-0">
        <MenubarMenu>
          <MenubarTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-df-text-secondary hover:text-df-text-primary rounded-md transition-colors data-[state=open]:text-df-text-primary hover:bg-df-control-hover/30 data-[state=open]:bg-df-control-hover/30 h-8">
            <Folder size={15} className="opacity-60" />
            File
          </MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger className="text-df-text-primary">
                <Download size={14} className="mr-2" />
                Download
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem 
                  onClick={downloadAsMarkdown}
                  disabled={!activePageId || !pageContent}
                  className="text-df-text-primary"
                >
                  <FileText size={14} className="mr-2" />
                  Markdown (.md)
                </MenubarItem>
                <MenubarItem 
                  onClick={downloadAsPDF}
                  disabled={!activePageId || !pageContent}
                  className="text-df-text-primary"
                >
                  <File size={14} className="mr-2" />
                  PDF (.pdf)
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Right: View menu */}
      <Menubar className="border-0 bg-transparent p-0">
        <MenubarMenu>
          <MenubarTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-df-text-secondary hover:text-df-text-primary rounded-md transition-colors data-[state=open]:text-df-text-primary hover:bg-df-control-hover/30 data-[state=open]:bg-df-control-hover/30 h-8">
            <Eye size={15} className="opacity-60" />
            View
          </MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              checked={isFullWidth}
              onCheckedChange={() => {
                if (activePageId) {
                  togglePageFullWidth(activePageId);
                }
              }}
              disabled={!activePageId}
              className="text-df-text-primary"
            >
              {isFullWidth ? <Minimize2 size={14} className="mr-2" /> : <Maximize2 size={14} className="mr-2" />}
              Full width
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
