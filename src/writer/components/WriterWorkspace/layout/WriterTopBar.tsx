import React from 'react';
import { FileText, File, Maximize2, Minimize2, Download, Folder, Eye, Settings, Save } from 'lucide-react';
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
import { convertSerializedContentToMarkdown } from '@/writer/lib/editor/export-utils';

export function WriterTopBar() {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageMap = useWriterWorkspaceStore((state) => state.pageMap);
  const pageLayout = useWriterWorkspaceStore((state) => state.pageLayout);
  const togglePageFullWidth = useWriterWorkspaceStore((state) => state.actions.togglePageFullWidth);
  const autosaveEnabled = useWriterWorkspaceStore((state) => state.autosaveEnabled);
  const setAutosaveEnabled = useWriterWorkspaceStore((state) => state.actions.setAutosaveEnabled);

  const activePage = activePageId ? pageMap.get(activePageId) ?? null : null;
  const serializedContent = activePage?.bookBody ?? '';
  const hasContent = !!(serializedContent && serializedContent.trim() && serializedContent !== '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}');
  const isFullWidth = activePageId
    ? pageLayout.fullWidthByPageId[activePageId] ?? false
    : false;

  const downloadAsMarkdown = async () => {
    const title = (activePage?.title ?? '').trim() || 'Untitled';
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
    const title = (activePage?.title ?? '').trim() || 'Untitled';
    const markdown = await convertSerializedContentToMarkdown(serializedContent);
    
    // Create a temporary window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Convert markdown to HTML for better PDF rendering
    // Simple markdown to HTML conversion for basic formatting
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
                  disabled={!activePageId || !hasContent}
                  className="text-df-text-primary"
                >
                  <FileText size={14} className="mr-2" />
                  Markdown (.md)
                </MenubarItem>
                <MenubarItem 
                  onClick={downloadAsPDF}
                  disabled={!activePageId || !hasContent}
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

      {/* Center: Project menu */}
      <Menubar className="border-0 bg-transparent p-0">
        <MenubarMenu>
          <MenubarTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-df-text-secondary hover:text-df-text-primary rounded-md transition-colors data-[state=open]:text-df-text-primary hover:bg-df-control-hover/30 data-[state=open]:bg-df-control-hover/30 h-8">
            <Settings size={15} className="opacity-60" />
            Project
          </MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              checked={autosaveEnabled}
              onCheckedChange={(checked) => {
                setAutosaveEnabled(checked === true);
              }}
              className="text-df-text-primary"
            >
              <Save size={14} className="mr-2" />
              Autosave
            </MenubarCheckboxItem>
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
