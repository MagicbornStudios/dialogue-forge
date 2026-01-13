// src/components/ForgeWorkspace/ForgeWorkspace.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import type { ForgeGraphDoc } from '../../types';
import type { ForgeGameState } from '../../types/forge-game-state';
import type { ForgeCharacter } from '../../types/characters';
import type { FlagSchema } from '../../types/flags';

import { GuidePanel } from '../shared/GuidePanel';
import { ForgeWorkspaceToolbar } from './components/ForgeWorkspaceToolbar';
import { ForgeNarrativeGraphEditor } from '../GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor';
import { ForgeStoryletGraphEditor } from '../GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
import { StoryletsSidebar } from './components/StoryletsSidebar';

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

interface ForgeWorkspaceProps {
  // Initial graphs (host-provided)
  narrativeGraph?: ForgeGraphDoc | null;
  storyletGraph?: ForgeGraphDoc | null;

  // Optional supporting data
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  gameState?: ForgeGameState;

  className?: string;
  toolbarActions?: React.ReactNode;

  onEvent?: (event: ForgeEvent) => void;

  // Optional graph resolver (if you lazy-load by id)
  resolveGraph?: (graphId: string) => Promise<ForgeGraphDoc>;

  // Persistence surface (already implemented)
  dataAdapter?: ForgeDataAdapter;

  // Project selection sync
  selectedProjectId?: number | null;
}

export function ForgeWorkspace({
  narrativeGraph,
  storyletGraph,
  flagSchema: initialFlagSchema,
  characters: initialCharacters,
  gameState: initialGameState,
  className = '',
  toolbarActions,
  onEvent,
  resolveGraph,
  dataAdapter,
  selectedProjectId,
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
      <ProjectSync selectedProjectId={selectedProjectId} />
      <ForgeWorkspaceContent
        characters={initialCharacters}
        className={className}
        toolbarActions={toolbarActions}
      />
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

function ForgeWorkspaceContent({
  characters,
  className = '',
  toolbarActions,
}: Pick<ForgeWorkspaceProps, 'characters' | 'className' | 'toolbarActions'>) {

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
  const setActiveNarrativeGraphId = useForgeWorkspaceStore((s) => s.actions.setActiveNarrativeGraphId);
  const setActiveStoryletGraphId = useForgeWorkspaceStore((s) => s.actions.setActiveStoryletGraphId);

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

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <ForgeWorkspaceToolbar
        counts={{ actCount: 0, chapterCount: 0, pageCount: 0, characterCount: Object.keys(characters ?? {}).length }}
        toolbarActions={toolbarActions}
        onGuideClick={() => { }}
        onPlayClick={() => { }}
        onFlagClick={() => { }}
      />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        {/* Storylets Sidebar */}
        <StoryletsSidebar />

        {/* Main editor area */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {narrativeGraph ? (
            <div className="h-[220px] min-h-[200px] rounded-lg border border-df-node-border bg-df-editor-bg p-1">
              <ForgeNarrativeGraphEditor 
                graph={narrativeGraph} 
                onChange={onNarrativeGraphChange} 
                className="h-full" 
              />
            </div>
          ) : (
            <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-3 text-sm text-df-text-secondary">
              No narrative graph loaded.
            </div>
          )}

          {storyletGraph ? (
            <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-1">
              <ForgeStoryletGraphEditor
                graph={storyletGraph}
                onChange={onStoryletGraphChange}
                flagSchema={activeFlagSchema}
                gameState={activeGameState}
                characters={characters}
                className="h-full"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-3 text-sm text-df-text-secondary">
              No storylet graph loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
