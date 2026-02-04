import React, { useState, useEffect, useRef } from 'react';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { FlagSchema } from '@magicborn/forge/types/flags';
import { SidebarPanel, NarrativeEditorPanel, StoryletEditorPanel } from './ForgeWorkspacePanels';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';

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
  const panelLayout = useForgeWorkspaceStore((s) => s.panelLayout);

  const resolvedScope = focusedEditor ?? graphScope;
  const contextNodeType = contextNodeTypeByScope[resolvedScope];
  const isFocused = Boolean(focusedEditor);

  // Check if any panel is docked (fullscreen) - with safe access
  const isNarrativeDocked = panelLayout?.narrativeEditor?.isDocked ?? false;
  const isStoryletDocked = panelLayout?.storyletEditor?.isDocked ?? false;
  const isNodeEditorDocked = panelLayout?.nodeEditor?.isDocked ?? false;

  // Track previous state for exit animations
  const prevNarrativeDocked = useRef(isNarrativeDocked);
  const prevStoryletDocked = useRef(isStoryletDocked);
  const [isNarrativeExiting, setIsNarrativeExiting] = useState(false);
  const [isStoryletExiting, setIsStoryletExiting] = useState(false);

  // Handle narrative editor exit animation
  useEffect(() => {
    if (prevNarrativeDocked.current && !isNarrativeDocked) {
      setIsNarrativeExiting(true);
      const timer = setTimeout(() => setIsNarrativeExiting(false), 300);
      return () => clearTimeout(timer);
    }
    prevNarrativeDocked.current = isNarrativeDocked;
  }, [isNarrativeDocked]);

  // Handle storylet editor exit animation
  useEffect(() => {
    if (prevStoryletDocked.current && !isStoryletDocked) {
      setIsStoryletExiting(true);
      const timer = setTimeout(() => setIsStoryletExiting(false), 300);
      return () => clearTimeout(timer);
    }
    prevStoryletDocked.current = isStoryletDocked;
  }, [isStoryletDocked]);

  // If a panel is docked, show only that panel with animation
  if (isNarrativeDocked || isNarrativeExiting) {
    return (
      <div
        className="flex h-full w-full fixed inset-0 z-50 bg-df-editor-bg"
        style={{
          animation: isNarrativeDocked 
            ? 'fadeInScale 300ms ease-in-out forwards'
            : 'fadeOutScale 300ms ease-in-out forwards',
        }}
        data-domain="forge"
        data-editor-scope="narrative"
        data-context-node-type={contextNodeType ?? undefined}
        data-focused="true"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.98);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeOutScale {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.98);
            }
          }
        `}} />
        <NarrativeEditorPanel 
          graph={narrativeGraph}
          onChange={onNarrativeGraphChange}
          flagSchema={flagSchema}
          gameState={gameState}
          characters={characters}
        />
      </div>
    );
  }

  if (isStoryletDocked || isStoryletExiting) {
    return (
      <div
        className="flex h-full w-full fixed inset-0 z-50 bg-df-editor-bg"
        style={{
          animation: isStoryletDocked
            ? 'fadeInScale 300ms ease-in-out forwards'
            : 'fadeOutScale 300ms ease-in-out forwards',
        }}
        data-domain="forge"
        data-editor-scope="storylet"
        data-context-node-type={contextNodeType ?? undefined}
        data-focused="true"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.98);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeOutScale {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.98);
            }
          }
        `}} />
        <StoryletEditorPanel 
          graph={storyletGraph}
          onChange={onStoryletGraphChange}
          flagSchema={flagSchema}
          gameState={gameState}
          characters={characters}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full"
      style={{
        animation: (isNarrativeExiting || isStoryletExiting) 
          ? 'fadeInScale 300ms ease-in-out forwards'
          : undefined,
      }}
      data-domain="forge"
      data-editor-scope={resolvedScope}
      data-context-node-type={contextNodeType ?? undefined}
      data-focused={isFocused ? 'true' : 'false'}
    >
      {panelVisibility.sidebar && !isNodeEditorDocked && (
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
      {isNodeEditorDocked && (
        <div className="fixed inset-0 z-50 bg-df-editor-bg">
          {/* Node editor will be rendered here when docked */}
        </div>
      )}
    </div>
  );
}
