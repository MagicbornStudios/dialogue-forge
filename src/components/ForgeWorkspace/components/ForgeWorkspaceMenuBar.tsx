import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarCheckboxItem,
} from '@/src/components/ui/menubar';
import {
  Play,
  Flag,
  HelpCircle,
  Layout,
  PanelLeft,
  FileText,
  Layers,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { Button } from '@/src/components/ui/button';
import { ForgeProjectSwitcher } from './ForgeProjectSwitcher';

type PanelId = 'sidebar' | 'narrative-editor' | 'storylet-editor';

export interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string;
}

interface ForgeWorkspaceMenuBarProps {
  onPlayClick: () => void;
  onFlagClick: () => void;
  onGuideClick: () => void;
  counts: {
    actCount: number;
    chapterCount: number;
    pageCount: number;
    characterCount: number;
  };
  toolbarActions?: React.ReactNode;
  panelVisibility: Record<PanelId, boolean>;
  onTogglePanel: (panelId: PanelId) => void;
  headerLinks?: HeaderLink[];
}

export function ForgeWorkspaceMenuBar({
  onPlayClick,
  onFlagClick,
  onGuideClick,
  counts,
  toolbarActions,
  panelVisibility,
  onTogglePanel,
  headerLinks,
}: ForgeWorkspaceMenuBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-df-sidebar-border bg-df-base/80 px-2 py-1 hover:border-[var(--color-df-border-hover)] transition-colors">
      <div className="flex items-center gap-2">
        <ForgeProjectSwitcher />
        {headerLinks && headerLinks.length > 0 && (
          <>
            <div className="h-4 w-px bg-df-control-border" />
            <div className="flex items-center gap-1">
              {headerLinks.map((link, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => window.open(link.href, link.target || '_blank')}
                  title={link.label}
                >
                  {link.icon}
                  <span className="ml-1.5">{link.label}</span>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
      <Menubar className="border-0 bg-transparent p-0">
        {/* File Menu */}
        <MenubarMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenubarTrigger className="px-3 py-1.5 text-sm font-medium">
                  File
                </MenubarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>File operations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MenubarContent>
            <MenubarItem onClick={onPlayClick}>
              <Play size={14} className="mr-2" />
              Play Selected Page
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onFlagClick}>
              <Flag size={14} className="mr-2" />
              Game State
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onGuideClick}>
              <HelpCircle size={14} className="mr-2" />
              Open Guide
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* View Menu */}
        <MenubarMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenubarTrigger className="px-3 py-1.5 text-sm font-medium">
                  View
                </MenubarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Panel layout options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MenubarContent>
            <MenubarItem>
              <span className="font-semibold">Panels</span>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              checked={panelVisibility.sidebar}
              onCheckedChange={() => onTogglePanel('sidebar')}
            >
              <PanelLeft size={14} className="mr-2" />
              Sidebar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={panelVisibility['narrative-editor']}
              onCheckedChange={() => onTogglePanel('narrative-editor')}
            >
              <FileText size={14} className="mr-2" />
              Narrative Editor
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={panelVisibility['storylet-editor']}
              onCheckedChange={() => onTogglePanel('storylet-editor')}
            >
              <Layers size={14} className="mr-2" />
              Storylet Editor
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Status Bar */}
      <div className="text-[11px] text-df-text-tertiary">
        {counts.actCount} acts · {counts.chapterCount} chapters · {counts.pageCount} pages · {counts.characterCount} characters
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center gap-2">{toolbarActions}</div>
    </div>
  );
}
