import React from 'react';
import { FileText, File, Maximize2, Minimize2, Download, Folder, Eye, Settings, Save } from 'lucide-react';
import { useWriterWorkspaceStore } from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
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
} from '@magicborn/shared/ui/menubar';
import { useWriterDownloadActions } from '@magicborn/writer/hooks/useWriterDownloadActions';

export function WriterTopBar() {
  const autosaveEnabled = useWriterWorkspaceStore((state) => state.autosaveEnabled);
  const setAutosaveEnabled = useWriterWorkspaceStore((state) => state.actions.setAutosaveEnabled);
  const {
    downloadAsMarkdown,
    downloadAsPDF,
    activePageId,
    isFullWidth,
    togglePageFullWidth,
    canDownload,
  } = useWriterDownloadActions();

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
                  disabled={!canDownload}
                  className="text-df-text-primary"
                >
                  <FileText size={14} className="mr-2" />
                  Markdown (.md)
                </MenubarItem>
                <MenubarItem 
                  onClick={downloadAsPDF}
                  disabled={!canDownload}
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
