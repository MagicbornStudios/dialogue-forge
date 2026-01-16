// src/components/ForgeWorkspace/ForgeWorkspace.tsx
import React, { useRef, useCallback, useEffect, useState } from 'react';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import type { ForgeGameState } from '@/forge/types/forge-game-state';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { FlagSchema } from '@/forge/types/flags';

import { ForgeWorkspaceMenuBar } from '@/forge/components/ForgeWorkspace/components/ForgeWorkspaceMenuBar';
import { ProjectSync } from '@/forge/components/ForgeWorkspace/components/ProjectSync';
import { ForgeWorkspaceLayout } from '@/forge/components/ForgeWorkspace/components/ForgeWorkspaceLayout';
import { ForgeWorkspaceModalsRenderer } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeWorkspaceModals';
import { NodeDragProvider } from '@/forge/components/ForgeWorkspace/hooks/useNodeDrag';

import {
  ForgeWorkspaceStoreProvider,
  createForgeWorkspaceStore,
  useForgeWorkspaceStore,
  type EventSink,
} from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';

import { setupForgeWorkspaceSubscriptions } from '@/forge/components/ForgeWorkspace/store/slices/subscriptions';
import type { ForgeEvent } from '@/forge/events/events';
import { ForgeDataAdapter } from '@/forge/adapters/forge-data-adapter';
import { useForgeWorkspaceActions } from '@/forge/copilotkit';
import { useForgeCopilotContext } from '@/forge/copilotkit/hooks/useForgeCopilotContext';
import { CopilotKitProvider } from '@/ai/copilotkit/providers/CopilotKitProvider';
import { CopilotChatModal } from './components/CopilotChatModal';

export interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string;
}

interface ForgeWorkspaceProps {
  // Initial graphs (host-provided)
  narrativeGraph?: ForgeGraphDoc | null;
  storyletGraph?: ForgeGraphDoc | null;

  // Optional supporting data
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  gameState?: ForgeGameState;

  className?: string;

  onEvent?: (event: ForgeEvent) => void;

  // Optional graph resolver (if you lazy-load by id)
  resolveGraph?: (graphId: string) => Promise<ForgeGraphDoc>;

  // Persistence surface (already implemented)
  dataAdapter?: ForgeDataAdapter;

  // Project selection sync
  selectedProjectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;

  // Optional header links (Admin, API, etc.)
  headerLinks?: HeaderLink[];
}

export function ForgeWorkspace({
  narrativeGraph,
  storyletGraph,
  flagSchema: initialFlagSchema,
  characters: initialCharacters,
  gameState: initialGameState,
  className = '',
  onEvent,
  resolveGraph,
  dataAdapter,
  selectedProjectId,
  onProjectChange,
  headerLinks,
}: ForgeWorkspaceProps) {
  const eventSinkRef = useRef<EventSink>({
    emit: (event) => {
      if (onEvent) {
        onEvent(event);
      }
    },
  });

  const storeRef = useRef(
    createForgeWorkspaceStore(
      {
        initialNarrativeGraph: narrativeGraph ?? null,
        initialStoryletGraph: storyletGraph ?? null,
        initialFlagSchema: initialFlagSchema,
        initialGameState: initialGameState,
        resolveGraph,
        dataAdapter,
      },
      eventSinkRef.current
    )
  );

  React.useEffect(() => {
    setupForgeWorkspaceSubscriptions(storeRef.current, eventSinkRef.current, dataAdapter);
  }, [dataAdapter]);

  return (
    <CopilotKitProvider
      instructions="You are an AI assistant for the Forge workspace. Help users create and edit dialogue graphs, manage flags, and build interactive narratives."
      defaultOpen={false}
    >
      <ForgeWorkspaceStoreProvider store={storeRef.current}>
        <ForgeWorkspaceActionsWrapper store={storeRef.current}>
          <NodeDragProvider>
            <ProjectSync selectedProjectId={selectedProjectId} />
            <ForgeWorkspaceContent
              characters={initialCharacters}
              className={className}
              headerLinks={headerLinks}
            />
          </NodeDragProvider>
        </ForgeWorkspaceActionsWrapper>
      </ForgeWorkspaceStoreProvider>
    </CopilotKitProvider>
  );
}

function ForgeWorkspaceActionsWrapper({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createForgeWorkspaceStore>;
}) {
  useForgeWorkspaceActions(store);
  useForgeCopilotContext(store);
  return <>{children}</>;
}

type PanelId = 'sidebar' | 'narrative-editor' | 'storylet-editor';

function ForgeWorkspaceContent({
  characters,
  className = '',
  headerLinks,
}: Pick<ForgeWorkspaceProps, 'characters' | 'className' | 'headerLinks'>) {

  // Get active graph IDs and derive graphs from cache
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  const activeFlagSchema = useForgeWorkspaceStore((s) => s.activeFlagSchema);
  const activeGameState = useForgeWorkspaceStore((s) => s.activeGameState);
  
  const narrativeGraph = useForgeWorkspaceStore((s) => 
    activeNarrativeGraphId ? s.graphs.byId[activeNarrativeGraphId] ?? null : null
  );
  const storyletGraph = useForgeWorkspaceStore((s) => 
    activeStoryletGraphId ? s.graphs.byId[activeStoryletGraphId] ?? null : null
  );

  const setGraph = useForgeWorkspaceStore((s) => s.actions.setGraph);
  const setActiveFlagSchema = useForgeWorkspaceStore((s) => s.actions.setActiveFlagSchema);
  const setActiveGameState = useForgeWorkspaceStore((s) => s.actions.setActiveGameState);
  
  // Panel layout state removed - using fixed layout

  // Panel visibility state - fix SSR
  const [panelVisibility, setPanelVisibility] = useState<Record<PanelId, boolean>>({
    sidebar: true,
    'narrative-editor': true,
    'storylet-editor': true,
  });

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVisibility = localStorage.getItem('forge-panel-visibility');
      if (savedVisibility) {
        try {
          setPanelVisibility(JSON.parse(savedVisibility));
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forge-panel-visibility', JSON.stringify(panelVisibility));
    }
  }, [panelVisibility]);


  // Toggle panel visibility - use conditional rendering
  const togglePanel = useCallback((panelId: PanelId) => {
    setPanelVisibility(prev => ({ ...prev, [panelId]: !prev[panelId] }));
  }, []);

  // Get dataAdapter from workspace store context (we'll need to pass it through)
  // For now, we'll handle default graph creation in a useEffect
  // TODO: Pass dataAdapter through context or props if needed for default creation

  const onNarrativeGraphChange = useCallback(
    (next: ForgeGraphDoc) => {
      setGraph(String(next.id), next);
    },
    [setGraph]
  );

  const onStoryletGraphChange = useCallback(
    (next: ForgeGraphDoc) => {
      setGraph(String(next.id), next);
    },
    [setGraph]
  );

  // Modal actions from store
  const openPlayModal = useForgeWorkspaceStore((s) => s.actions.openPlayModal);
  const openFlagModal = useForgeWorkspaceStore((s) => s.actions.openFlagModal);
  const openGuide = useForgeWorkspaceStore((s) => s.actions.openGuide);
  const isCopilotChatOpen = useForgeWorkspaceStore((s) => s.modalState.isCopilotChatOpen);
  const closeCopilotChat = useForgeWorkspaceStore((s) => s.actions.closeCopilotChat);

  // Wrapper callbacks for modals
  const handleUpdateFlagSchema = useCallback(
    (schema: FlagSchema) => {
      setActiveFlagSchema(schema);
    },
    [setActiveFlagSchema]
  );

  const handleUpdateGameState = useCallback(
    (state: ForgeGameState) => {
      setActiveGameState(state);
    },
    [setActiveGameState]
  );

  const editorTokens = {
    '--editor-border-hover': 'var(--color-df-border-hover)',
    '--editor-border-active': 'var(--color-df-border-active)',
    '--editor-info': 'var(--color-df-info)',
    '--editor-edge-choice': 'var(--color-df-edge-choice-1)',
    '--editor-warning': 'var(--color-df-warning)',
    '--editor-npc-border': 'var(--color-df-npc-border)',
    '--editor-player-border': 'var(--color-df-player-border)',
    '--editor-conditional-border': 'var(--color-df-conditional-border)',
    '--editor-muted-foreground': 'var(--color-df-text-tertiary)',
  } as React.CSSProperties;

  return (
    <div className={`flex h-full w-full flex-col ${className}`} style={editorTokens}>
      <ForgeWorkspaceMenuBar
        counts={{ actCount: 0, chapterCount: 0, pageCount: 0, characterCount: Object.keys(characters ?? {}).length }}
        onGuideClick={openGuide}
        onPlayClick={openPlayModal}
        onFlagClick={openFlagModal}
        panelVisibility={panelVisibility}
        onTogglePanel={togglePanel}
        headerLinks={headerLinks}
      />
      
      <CopilotChatModal
        isOpen={isCopilotChatOpen}
        onClose={closeCopilotChat}
        instructions="You are an AI assistant for the Forge workspace. Help users create and edit dialogue graphs, manage flags, and build interactive narratives. You have access to chapters, acts, pages, and graphs for context."
      />

      <ForgeWorkspaceLayout
        panelVisibility={panelVisibility}
        narrativeGraph={narrativeGraph}
        storyletGraph={storyletGraph}
        flagSchema={activeFlagSchema}
        gameState={activeGameState}
        characters={characters}
        onNarrativeGraphChange={onNarrativeGraphChange}
        onStoryletGraphChange={onStoryletGraphChange}
      />

      <ForgeWorkspaceModalsRenderer
        narrativeGraph={narrativeGraph}
        storyletGraph={storyletGraph}
        flagSchema={activeFlagSchema}
        gameState={activeGameState}
        characters={characters}
        onUpdateFlagSchema={handleUpdateFlagSchema}
        onUpdateGameState={handleUpdateGameState}
      />
    </div>
  );
}
