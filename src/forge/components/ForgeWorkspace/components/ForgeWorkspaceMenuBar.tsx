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
} from '@/shared/ui/menubar';
import {
  Play,
  Flag,
  HelpCircle,
  Layout,
  PanelLeft,
  FileText,
  Layers,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Button } from '@/shared/ui/button';
import { ForgeProjectSwitcher } from './ForgeProjectSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

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
  panelVisibility: Record<PanelId, boolean>;
  onTogglePanel: (panelId: PanelId) => void;
  headerLinks?: HeaderLink[];
}

export function ForgeWorkspaceMenuBar({
  onPlayClick,
  onFlagClick,
  onGuideClick,
  counts,
  panelVisibility,
  onTogglePanel,
  headerLinks,
}: ForgeWorkspaceMenuBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 px-2 py-1 hover:border-[var(--editor-border-hover)] transition-colors duration-200">
      {/* Left Section: Project Switcher + Menus */}
      <div className="flex items-center gap-2">
        <ForgeProjectSwitcher />
        <Menubar className="border-0 bg-transparent p-0">
          {/* File Menu */}
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 text-sm font-medium border border-transparent hover:border-border hover:bg-muted rounded-sm transition-colors data-[state=open]:bg-muted data-[state=open]:border-border">
              File
            </MenubarTrigger>
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
            <MenubarTrigger className="px-3 py-1.5 text-sm font-medium border border-transparent hover:border-border hover:bg-muted rounded-sm transition-colors data-[state=open]:bg-muted data-[state=open]:border-border">
              View
            </MenubarTrigger>
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
      </div>

      {/* Center Section: Status Bar */}
      <div className="text-[11px] text-muted-foreground">
        {counts.actCount} acts · {counts.chapterCount} chapters · {counts.pageCount} pages · {counts.characterCount} characters
      </div>

      {/* Right Section: Header Links + Theme Switcher */}
      <div className="flex items-center gap-2">
        {headerLinks && headerLinks.length > 0 && (
          <>
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
            <div className="h-4 w-px bg-border" />
          </>
        )}
        <ThemeSwitcher />
      </div>
    </div>
  );
}
