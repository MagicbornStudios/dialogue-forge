// src/components/ForgeWorkspace/ForgeWorkspace.tsx
import React, { useRef, useCallback, useEffect, useState } from 'react';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { FlagSchema } from '@magicborn/forge/types/flags';
import { ForgeWorkspaceMenuBar } from '@magicborn/forge/components/ForgeWorkspace/components/ForgeWorkspaceMenuBar';
import { ProjectSync } from '@magicborn/forge/components/ForgeWorkspace/components/ProjectSync';
import { ForgeWorkspaceLayout } from '@magicborn/forge/components/ForgeWorkspace/components/ForgeWorkspaceLayout';
import { ForgeWorkspaceModalsRenderer } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeWorkspaceModals';
import { NodeDragProvider } from '@magicborn/forge/components/ForgeWorkspace/hooks/useNodeDrag';

import {
  ForgeWorkspaceStoreProvider,
  createForgeWorkspaceStore,
  useForgeWorkspaceStore,
  type EventSink,
} from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';

import { setupForgeWorkspaceSubscriptions } from '@magicborn/forge/components/ForgeWorkspace/store/slices/subscriptions';
import type { ForgeEvent } from '@magicborn/forge/events/events';
import { ForgeDataAdapter } from '@magicborn/forge/adapters/forge-data-adapter';
import { useForgeDataContext } from './ForgeDataContext';
import { useForgeWorkspaceActions } from '@magicborn/forge/copilotkit';
import { useForgeCopilotContext } from '@magicborn/forge/copilotkit/hooks/useForgeCopilotContext';
import { CopilotKitProvider } from '@magicborn/ai/copilotkit/providers/CopilotKitProvider';
import { CopilotChatModal } from './components/CopilotChatModal';
import { CommandBar, useCommandBar } from './components/CommandBar/CommandBar';
import { TooltipProvider } from '@magicborn/shared/ui/tooltip';

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
  const adapterFromContext = useForgeDataContext();
  const effectiveAdapter = dataAdapter ?? adapterFromContext;

  const eventSinkRef = useRef<EventSink>({
    emit: (event) => {
      if (onEvent) {
        onEvent(event);
      }
    },
  });

  const adapterRef = useRef<ForgeDataAdapter | null>(effectiveAdapter);
  adapterRef.current = effectiveAdapter;

  const storeRef = useRef(
    createForgeWorkspaceStore(
      {
        initialNarrativeGraph: narrativeGraph ?? null,
        initialStoryletGraph: storyletGraph ?? null,
        initialFlagSchema: initialFlagSchema,
        initialGameState: initialGameState,
        resolveGraph,
        getDataAdapter: () => adapterRef.current ?? null,
      },
      eventSinkRef.current
    )
  );

  React.useEffect(() => {
    setupForgeWorkspaceSubscriptions(storeRef.current, eventSinkRef.current, effectiveAdapter ?? undefined);
  }, [effectiveAdapter]);

  return (
    <CopilotKitProvider
      instructions="You are an AI assistant for the Forge workspace. Help users create and edit dialogue graphs, manage flags, and build interactive narratives."
      defaultOpen={false}
    >
      <ForgeWorkspaceStoreProvider store={storeRef.current}>
        <TooltipProvider>
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
        </TooltipProvider>
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

  const dataAdapter = useForgeDataContext();
  const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);
  const openGraphInScope = useForgeWorkspaceStore((s) => s.actions.openGraphInScope);
  const setActiveNarrativeGraphId = useForgeWorkspaceStore((s) => s.actions.setActiveNarrativeGraphId);
  const setActiveStoryletGraphId = useForgeWorkspaceStore((s) => s.actions.setActiveStoryletGraphId);

  const onNarrativeGraphChange = useCallback(
    async (next: ForgeGraphDoc) => {
      // Immediately update local store for instant UI feedback
      setGraph(String(next.id), next);

      // If graph has no ID (id === 0), it's a new graph that needs to be created in the database
      // This happens when the first node is added to a blank graph
      if (next.id === 0 && dataAdapter && selectedProjectId && next.flow.nodes.length > 0) {
        try {
          // Create graph first without title (or use provided title)
          const createdGraph = await dataAdapter.createGraph({
            projectId: selectedProjectId,
            kind: next.kind,
            title: next.title || '', // Will be set after creation if not provided
            flow: next.flow,
            startNodeId: next.startNodeId,
            endNodeIds: next.endNodeIds,
          });
          
          // Generate default title with first 4 digits of graph ID
          const graphIdStr = String(createdGraph.id);
          const defaultTitle = `New Graph ${graphIdStr.slice(0, 4)}`;
          const finalTitle = createdGraph.title || defaultTitle;
          
          // Update title in database if we generated a default
          if (!createdGraph.title) {
            await dataAdapter.updateGraph(createdGraph.id, { title: finalTitle });
          }
          
          // Update the graph with the new ID and title, set it in store FIRST
          const updatedGraph = { ...next, id: createdGraph.id, title: finalTitle };
          setGraph(String(createdGraph.id), updatedGraph);
          
          // Set as active graph immediately (synchronously)
          setActiveNarrativeGraphId(String(createdGraph.id));
          
          // Then open it (which will ensure it's loaded and push breadcrumb)
          // Graph is already in store, so ensureGraph will return early
          setTimeout(() => {
            openGraphInScope('narrative', String(createdGraph.id), { pushBreadcrumb: true });
          }, 0);
        } catch (error) {
          console.error('Failed to create graph:', error);
          alert('Failed to create graph. Please try again.');
        }
        return;
      }

      // For existing graphs, save immediately (editor debounces continuous changes)
      if (!dataAdapter || next.id === 0) return;

      try {
        await dataAdapter.updateGraph(next.id, {
          flow: next.flow,
          startNodeId: next.startNodeId,
          endNodeIds: next.endNodeIds,
          title: next.title,
        });
      } catch (error) {
        console.error('Failed to save graph:', error);
        // Keep editing - changes are in memory
      }
    },
    [dataAdapter, selectedProjectId, openGraphInScope, setGraph, setActiveNarrativeGraphId]
  );

  const onStoryletGraphChange = useCallback(
    async (next: ForgeGraphDoc) => {
      // Immediately update local store for instant UI feedback
      setGraph(String(next.id), next);

      // If graph has no ID (id === 0), it's a new graph that needs to be created in the database
      // This happens when the first node is added to a blank graph
      if (next.id === 0 && dataAdapter && selectedProjectId && next.flow.nodes.length > 0) {
        try {
          // Create graph first without title (or use provided title)
          const createdGraph = await dataAdapter.createGraph({
            projectId: selectedProjectId,
            kind: next.kind,
            title: next.title || '', // Will be set after creation if not provided
            flow: next.flow,
            startNodeId: next.startNodeId,
            endNodeIds: next.endNodeIds,
          });
          
          // Generate default title with first 4 digits of graph ID
          const graphIdStr = String(createdGraph.id);
          const defaultTitle = `New Graph ${graphIdStr.slice(0, 4)}`;
          const finalTitle = createdGraph.title || defaultTitle;
          
          // Update title in database if we generated a default
          if (!createdGraph.title) {
            await dataAdapter.updateGraph(createdGraph.id, { title: finalTitle });
          }
          
          // Update the graph with the new ID and title, set it in store FIRST
          const updatedGraph = { ...next, id: createdGraph.id, title: finalTitle };
          setGraph(String(createdGraph.id), updatedGraph);
          
          // Set as active graph immediately (synchronously)
          setActiveStoryletGraphId(String(createdGraph.id));
          
          // Then open it (which will ensure it's loaded and push breadcrumb)
          // Graph is already in store, so ensureGraph will return early
          setTimeout(() => {
            openGraphInScope('storylet', String(createdGraph.id), { pushBreadcrumb: true });
          }, 0);
        } catch (error) {
          console.error('Failed to create graph:', error);
          alert('Failed to create graph. Please try again.');
        }
        return;
      }

      // For existing graphs, save immediately (editor debounces continuous changes)
      if (!dataAdapter || next.id === 0) return;

      try {
        await dataAdapter.updateGraph(next.id, {
          flow: next.flow,
          startNodeId: next.startNodeId,
          endNodeIds: next.endNodeIds,
          title: next.title,
        });
      } catch (error) {
        console.error('Failed to save graph:', error);
        // Keep editing - changes are in memory
      }
    },
    [dataAdapter, selectedProjectId, openGraphInScope, setGraph, setActiveStoryletGraphId]
  );

  // Modal actions from store
  const openFlagModal = useForgeWorkspaceStore((s) => s.actions.openFlagModal);
  const openGuide = useForgeWorkspaceStore((s) => s.actions.openGuide);
  const isCopilotChatOpen = useForgeWorkspaceStore((s) => s.modalState.isCopilotChatOpen);
  const closeCopilotChat = useForgeWorkspaceStore((s) => s.actions.closeCopilotChat);
  
  // Command bar
  const { open: commandBarOpen, setOpen: setCommandBarOpen } = useCommandBar();

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

      <CommandBar open={commandBarOpen} onOpenChange={setCommandBarOpen} />

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
