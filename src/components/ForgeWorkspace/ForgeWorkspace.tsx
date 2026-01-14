// src/components/ForgeWorkspace/ForgeWorkspace.tsx
import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import type { ForgeGraphDoc } from '../../types';
import type { ForgeGameState } from '../../types/forge-game-state';
import type { ForgeCharacter } from '../../types/characters';
import type { FlagSchema } from '../../types/flags';

import { ForgeWorkspaceMenuBar } from './components/ForgeWorkspaceMenuBar';
import { ForgeNarrativeGraphEditor } from '../GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor';
import { ForgeStoryletGraphEditor } from '../GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
import { ForgeSidebar } from './components/ForgeSidebar';
import { NodeDragProvider } from './hooks/useNodeDrag';

import {
  CreateForgeWorkspaceStoreOptions,
  ForgeWorkspaceStoreProvider,
  createForgeWorkspaceStore,
  useForgeWorkspaceStore,
  type EventSink,
} from './store/forge-workspace-store';

import { setupForgeWorkspaceSubscriptions } from './store/slices/subscriptions';
import type { ForgeEvent } from '@/src/components/forge/events/events';
import { ForgeDataAdapter } from '../forge/forge-data-adapter/forge-data-adapter';

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
    <ForgeWorkspaceStoreProvider store={storeRef.current}>
      <NodeDragProvider>
        <ProjectSync selectedProjectId={selectedProjectId} />
        <ForgeWorkspaceContent
          characters={initialCharacters}
          className={className}
          headerLinks={headerLinks}
        />
      </NodeDragProvider>
    </ForgeWorkspaceStoreProvider>
  );
}

function ProjectSync({ selectedProjectId }: { selectedProjectId?: number | null }) {
  const setSelectedProjectId = useForgeWorkspaceStore((s) => s.actions.setSelectedProjectId);
  
  useEffect(() => {
    setSelectedProjectId(selectedProjectId ?? null);
  }, [selectedProjectId, setSelectedProjectId]);
  
  return null;
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

  // Panel content components
  const SidebarPanel = () => (
    <div className="h-full w-full flex flex-col">
      <ForgeSidebar className="flex-1 min-h-0" />
    </div>
  );

  const NarrativeEditorPanel = () => (
    narrativeGraph ? (
      <div className="h-full w-full flex flex-col">
        <ForgeNarrativeGraphEditor 
          graph={narrativeGraph} 
          onChange={onNarrativeGraphChange} 
          className="h-full w-full" 
        />
      </div>
    ) : (
      <div className="h-full w-full flex items-center justify-center text-df-text-secondary text-sm">
        No narrative graph loaded
      </div>
    )
  );

  const StoryletEditorPanel = () => (
    storyletGraph ? (
      <div className="h-full w-full flex flex-col">
        <ForgeStoryletGraphEditor
          graph={storyletGraph}
          onChange={onStoryletGraphChange}
          flagSchema={activeFlagSchema}
          gameState={activeGameState}
          characters={characters}
          className="h-full w-full"
        />
      </div>
    ) : (
      <div className="h-full w-full flex items-center justify-center text-df-text-secondary text-sm">
        No storylet graph loaded
      </div>
    )
  );

  // Render layout - fixed layout with flexbox (no resizing)
  // Narrative graph on top, storylet graph on bottom, sidebar on left
  const renderLayout = () => {
    return (
      <div className="flex h-full w-full">
        {panelVisibility.sidebar && (
          <div className="w-[280px] border-r border-df-sidebar-border flex-shrink-0 relative group">
            <div className="absolute inset-y-0 right-0 w-[1px] bg-[var(--color-df-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <SidebarPanel />
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          {panelVisibility['narrative-editor'] && (
            <div className="flex-1 border-b border-df-sidebar-border min-h-0 relative group">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-[var(--color-df-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <NarrativeEditorPanel />
            </div>
          )}
          {panelVisibility['storylet-editor'] && (
            <div className="flex-1 min-h-0">
              <StoryletEditorPanel />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <ForgeWorkspaceMenuBar
        counts={{ actCount: 0, chapterCount: 0, pageCount: 0, characterCount: Object.keys(characters ?? {}).length }}
        onGuideClick={() => { }}
        onPlayClick={() => { }}
        onFlagClick={() => { }}
        panelVisibility={panelVisibility}
        onTogglePanel={togglePanel}
        headerLinks={headerLinks}
      />

      {renderLayout()}
    </div>
  );
}
