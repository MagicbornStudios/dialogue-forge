'use client';

import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/shared/ui/command';
import { Kbd, KbdGroup } from '@/shared/ui/kbd';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { FORGE_GRAPH_KIND } from '@/forge/types/forge-graph';
import { BookOpen, Layers, Bot } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Command bar component using cmdk
 * Provides quick access to workspace actions via Ctrl+K (Windows) or Cmd+K (Mac)
 */
export function CommandBar({ open, onOpenChange }: CommandBarProps) {
  const allGraphs = useForgeWorkspaceStore((s) => s.graphs.byId);
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  const workspaceActions = useForgeWorkspaceActions();
  const openCopilotChat = useForgeWorkspaceStore((s) => s.actions.openCopilotChat);

  // Get all graphs (CommandDialog will handle filtering)
  const narrativeGraphs = Object.values(allGraphs).filter(
    (g) => g.kind === FORGE_GRAPH_KIND.NARRATIVE
  );
  const storyletGraphs = Object.values(allGraphs).filter(
    (g) => g.kind === FORGE_GRAPH_KIND.STORYLET
  );

  // Detect OS for modifier key display
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              openCopilotChat();
              onOpenChange(false);
            }}
          >
            <Bot className="mr-2 h-4 w-4" />
            <span>Open AI Assistant</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>{modifierKey}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {/* Narratives */}
        {narrativeGraphs.length > 0 && (
          <CommandGroup heading="Narratives">
            {narrativeGraphs.map((graph) => {
              const isActive = activeNarrativeGraphId === String(graph.id);
              return (
                <CommandItem
                  key={graph.id}
                  onSelect={() => {
                    workspaceActions.openNarrativeGraph(String(graph.id));
                    onOpenChange(false);
                  }}
                  className={cn(isActive && 'bg-muted')}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span className="truncate">{graph.title || `Graph ${graph.id}`}</span>
                  {isActive && (
                    <CommandShortcut>
                      <span className="text-xs text-muted-foreground">Active</span>
                    </CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Storylets */}
        {storyletGraphs.length > 0 && (
          <CommandGroup heading="Storylets">
            {storyletGraphs.map((graph) => {
              const isActive = activeStoryletGraphId === String(graph.id);
              return (
                <CommandItem
                  key={graph.id}
                  onSelect={() => {
                    workspaceActions.openStoryletGraph(String(graph.id));
                    onOpenChange(false);
                  }}
                  className={cn(isActive && 'bg-muted')}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  <span className="truncate">{graph.title || `Graph ${graph.id}`}</span>
                  {isActive && (
                    <CommandShortcut>
                      <span className="text-xs text-muted-foreground">Active</span>
                    </CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to manage command bar state and hotkeys
 */
export function useCommandBar() {
  const [open, setOpen] = useState(false);

  // Detect OS for correct modifier key
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? 'meta' : 'ctrl';

  // Register hotkey: Ctrl+K (Windows) or Cmd+K (Mac)
  useHotkeys(
    `${modifierKey}+k`,
    (e) => {
      e.preventDefault();
      setOpen((prev) => !prev);
    },
    { enableOnFormTags: true }
  );

  return { open, setOpen };
}
