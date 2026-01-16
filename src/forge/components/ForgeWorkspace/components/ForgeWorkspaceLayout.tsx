import React from 'react';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import type { ForgeGameState } from '@/forge/types/forge-game-state';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { FlagSchema } from '@/forge/types/flags';
import { SidebarPanel, NarrativeEditorPanel, StoryletEditorPanel } from './ForgeWorkspacePanels';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';

type PanelId = 'sidebar' | 'narrative-editor' | 'storylet-editor';

interface ForgeWorkspaceLayoutProps {
  panelVisibility: Record<PanelId, boolean>;
  narrativeGraph: ForgeGraphDoc | null;
  storyletGraph: ForgeGraphDoc | null;
  flagSchema?: FlagSchema;
  gameState?: ForgeGameState;
  characters?: Record<string, ForgeCharacter>;
  onNarrativeGraphChange: (graph: ForgeGraphDoc) => void;
  onStoryletGraphChange: (graph: ForgeGraphDoc) => void;
}

export function ForgeWorkspaceLayout({
  panelVisibility,
  narrativeGraph,
  storyletGraph,
  flagSchema,
  gameState,
  characters,
  onNarrativeGraphChange,
  onStoryletGraphChange,
}: ForgeWorkspaceLayoutProps) {
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
  const graphScope = useForgeWorkspaceStore((s) => s.graphScope);
  const contextNodeTypeByScope = useForgeWorkspaceStore((s) => s.contextNodeTypeByScope);

  const resolvedScope = focusedEditor ?? graphScope;
  const contextNodeType = contextNodeTypeByScope[resolvedScope];
  const isFocused = Boolean(focusedEditor);

  return (
    <div
      className="flex h-full w-full"
      data-domain="forge"
      data-editor-scope={resolvedScope}
      data-context-node-type={contextNodeType ?? undefined}
      data-focused={isFocused ? 'true' : 'false'}
    >
      {panelVisibility.sidebar && (
        <div className="w-[280px] border-r border-border flex-shrink-0 relative group">
          <div className="absolute inset-y-0 right-0 w-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <SidebarPanel />
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {panelVisibility['narrative-editor'] && (
          <div className="flex-1 border-b border-border min-h-0 relative group">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <NarrativeEditorPanel 
              graph={narrativeGraph}
              onChange={onNarrativeGraphChange}
              flagSchema={flagSchema}
              gameState={gameState}
              characters={characters}
            />
          </div>
        )}
        {panelVisibility['storylet-editor'] && (
          <div className="flex-1 min-h-0">
            <StoryletEditorPanel 
              graph={storyletGraph}
              onChange={onStoryletGraphChange}
              flagSchema={flagSchema}
              gameState={gameState}
              characters={characters}
            />
          </div>
        )}
      </div>
    </div>
  );
}
