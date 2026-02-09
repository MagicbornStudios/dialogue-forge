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
} from '@magicborn/shared/ui/menubar';
import {
  Flag,
  HelpCircle,
  PanelLeft,
  FileText,
  Layers,
  Play,
} from 'lucide-react';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { Button } from '@magicborn/shared/ui/button';
import { ForgeProjectSwitcher } from './ForgeProjectSwitcher';
import type { ForgeGameStateRecord } from '@magicborn/shared/types/forge-game-state';
import {
  useCreateForgeGameState,
  useDeleteForgeGameState,
  useSetActiveForgeGameState,
} from '@magicborn/forge/data/forge-queries';

type PanelId = 'sidebar' | 'narrative-editor' | 'storylet-editor';

export interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string;
}

interface ForgeWorkspaceMenuBarProps {
  onFlagClick: () => void;
  onGuideClick: () => void;
  onPlayClick: () => void;
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
  onFlagClick,
  onGuideClick,
  onPlayClick,
  counts,
  panelVisibility,
  onTogglePanel,
  headerLinks,
}: ForgeWorkspaceMenuBarProps) {
  const gameStatesById = useForgeWorkspaceStore((s) => s.gameStatesById);
  const activeGameStateId = useForgeWorkspaceStore((s) => s.activeGameStateId);
  const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);
  const setActiveGameStateId = useForgeWorkspaceStore((s) => s.actions.setActiveGameStateId);
  const upsertGameState = useForgeWorkspaceStore((s) => s.actions.upsertGameState);
  const removeGameState = useForgeWorkspaceStore((s) => s.actions.removeGameState);
  const createGameStateMutation = useCreateForgeGameState();
  const setActiveGameStateMutation = useSetActiveForgeGameState();
  const deleteGameStateMutation = useDeleteForgeGameState();

  const sortedGameStates = React.useMemo(() => {
    return Object.values(gameStatesById).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return a.name.localeCompare(b.name);
    });
  }, [gameStatesById]);

  const activeGameState = activeGameStateId ? gameStatesById[String(activeGameStateId)] : undefined;

  const handleCreateGameState = async () => {
    if (!selectedProjectId) return;
    const name = window.prompt('Name your new game state');
    if (!name) return;
    try {
      const created = await createGameStateMutation.mutateAsync({
        projectId: selectedProjectId,
        name,
        state: { flags: {} },
      });
      upsertGameState(created, selectedProjectId);
      setActiveGameStateId(created.id, selectedProjectId);
      await setActiveGameStateMutation.mutateAsync({
        projectId: selectedProjectId,
        gameStateId: created.id,
      });
    } catch (error) {
      console.error('Failed to create game state:', error);
    }
  };

  const handleSwitchGameState = async (gameStateId: number) => {
    if (!selectedProjectId) return;
    setActiveGameStateId(gameStateId, selectedProjectId);
    try {
      await setActiveGameStateMutation.mutateAsync({
        projectId: selectedProjectId,
        gameStateId,
      });
    } catch (error) {
      console.error('Failed to set active game state:', error);
    }
  };

  const handleDeleteActiveGameState = async () => {
    if (!selectedProjectId || !activeGameStateId) return;
    if (sortedGameStates.length <= 1) return;
    const confirmed = window.confirm(`Delete game state "${activeGameState?.name ?? 'Untitled'}"?`);
    if (!confirmed) return;
    try {
      await deleteGameStateMutation.mutateAsync(activeGameStateId);
      removeGameState(activeGameStateId, selectedProjectId);
      const remaining = sortedGameStates.filter((state) => state.id !== activeGameStateId);
      const nextActive = remaining[0]?.id ?? null;
      if (nextActive !== null) {
        await setActiveGameStateMutation.mutateAsync({
          projectId: selectedProjectId,
          gameStateId: nextActive,
        });
        setActiveGameStateId(nextActive, selectedProjectId);
      }
    } catch (error) {
      console.error('Failed to delete game state:', error);
    }
  };

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
              <MenubarItem onClick={onFlagClick}>
                <Flag size={14} className="mr-2" />
                Game State
              </MenubarItem>
              <MenubarItem onClick={onPlayClick}>
                <Play size={14} className="mr-2" />
                Play Scene
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

          {/* Game State Menu */}
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 text-sm font-medium border border-transparent hover:border-border hover:bg-muted rounded-sm transition-colors data-[state=open]:bg-muted data-[state=open]:border-border">
              State
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleCreateGameState} disabled={!selectedProjectId}>
                Create Game State
              </MenubarItem>
              <MenubarSeparator />
              {sortedGameStates.length === 0 ? (
                <MenubarItem disabled>No game states yet</MenubarItem>
              ) : (
                <MenubarRadioGroup value={activeGameStateId ? String(activeGameStateId) : undefined}>
                  {sortedGameStates.map((state) => (
                    <MenubarRadioItem
                      key={state.id}
                      value={String(state.id)}
                      onClick={() => handleSwitchGameState(state.id)}
                    >
                      {state.name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              )}
              <MenubarSeparator />
              <MenubarItem
                onClick={handleDeleteActiveGameState}
                disabled={!activeGameStateId || sortedGameStates.length <= 1}
              >
                Delete Active State
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Center Section: Status Bar */}
      <div className="text-[11px] text-muted-foreground">
        {counts.actCount} acts · {counts.chapterCount} chapters · {counts.pageCount} pages · {counts.characterCount} characters
      </div>

      {/* Right Section: Header Links */}
      {headerLinks && headerLinks.length > 0 && (
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
      )}
    </div>
  );
}
