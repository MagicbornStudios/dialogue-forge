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
} from '@magicborn/shared/ui/command';
import { Kbd } from '@magicborn/shared/ui/kbd';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useForgeWorkspaceActions } from '@magicborn/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { FORGE_GRAPH_KIND } from '@magicborn/forge/types/forge-graph';
import { BookOpen, Layers, Edit } from 'lucide-react';
import { cn } from '@magicborn/shared/lib/utils';

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Command bar component using cmdk
 * Provides quick access to workspace actions via Ctrl+K (Windows) or Cmd+K (Mac)
 * Context-aware: shows different commands based on focused editor
 */
export function CommandBar({ open, onOpenChange }: CommandBarProps) {
  const allGraphs = useForgeWorkspaceStore((s) => s.graphs.byId);
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
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

  // Get current active graph for editor-specific commands
  const currentGraphId = focusedEditor === 'narrative' 
    ? activeNarrativeGraphId 
    : focusedEditor === 'storylet' 
    ? activeStoryletGraphId 
    : null;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Editor-specific commands */}
        {focusedEditor && currentGraphId && (
          <CommandGroup heading={`${focusedEditor === 'narrative' ? 'Narrative' : 'Storylet'} Editor`}>
            <CommandItem
              onSelect={() => {
                // Trigger rename via F2 - this will be handled by the breadcrumb component
                // We can dispatch an event or use a ref, but for now just show the command
                onOpenChange(false);
                // The F2 hotkey in breadcrumbs will handle this
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Rename Graph</span>
              <CommandShortcut>
                <Kbd>F2</Kbd>
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

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
