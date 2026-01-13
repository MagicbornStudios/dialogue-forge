// src/components/ForgeWorkspace/ForgeWorkspace.tsx
import React, { useRef, useCallback } from 'react';
import type { ForgeGraphDoc } from '../../types';
import type { BaseGameState } from '../../types/game-state';
import type { Character } from '../../types/characters';
import type { FlagSchema } from '../../types/flags';

import { GuidePanel } from '../shared/GuidePanel';
import { ForgeWorkspaceToolbar } from './components/ForgeWorkspaceToolbar';
import { ForgeNarrativeGraphEditor } from '../GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor';
import { ForgeStoryletGraphEditor } from '../GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
import { StoryletsSidebar } from './components/StoryletsSidebar';

import {
  ForgeUIStoreProvider,
  createForgeUIStore,
  useForgeUIStore,
} from '@/src/components/forge/store/forge-ui-store';

import {
  ForgeWorkspaceStoreProvider,
  createForgeWorkspaceStore,
  useForgeWorkspaceStore,
  type EventSink,
} from './store/forge-workspace-store';

import { setupForgeWorkspaceSubscriptions } from './store/slices/subscriptions';
import type { DialogueForgeEvent } from '@/src/components/forge/events/events';
import { ForgeDataAdapter } from '../forge/forge-data-adapter/forge-data-adapter';

interface ForgeWorkspaceProps {
  // Initial graphs (host-provided)
  narrativeGraph?: ForgeGraphDoc | null;
  storyletGraph?: ForgeGraphDoc | null;

  // Optional supporting data
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
  gameState?: BaseGameState;

  className?: string;
  toolbarActions?: React.ReactNode;

  onEvent?: (event: DialogueForgeEvent) => void;

  // Optional graph resolver (if you lazy-load by id)
  resolveGraph?: (graphId: string) => Promise<ForgeGraphDoc>;

  // Persistence surface (already implemented)
  dataAdapter?: ForgeDataAdapter;
}

export function ForgeWorkspace({
  narrativeGraph,
  storyletGraph,
  flagSchema,
  characters,
  gameState,
  className = '',
  toolbarActions,
  onEvent,
  resolveGraph,
  dataAdapter,
}: ForgeWorkspaceProps) {
  const uiStoreRef = useRef<ReturnType<typeof createForgeUIStore> | null>(null);
  const domainStoreRef = useRef<ReturnType<typeof createForgeWorkspaceStore> | null>(null);

  if (!uiStoreRef.current) {
    // Stop using initialThread. Just create default UI store state.
    // If your createForgeUIStore requires an argument, pass a minimal selection object.
    uiStoreRef.current = createForgeUIStore(undefined as any);
  }

  if (!domainStoreRef.current) {
    const eventSink: EventSink = {
      emit: (event) => onEvent?.(event),
    };

    domainStoreRef.current = createForgeWorkspaceStore(
      {
        initialNarrativeGraph: narrativeGraph ?? null,
        initialStoryletGraph: storyletGraph ?? null,
        flagSchema,
        gameState,
        resolveGraph,
        dataAdapter,
      } as any,
      eventSink
    );

    setupForgeWorkspaceSubscriptions(
      domainStoreRef.current,
      uiStoreRef.current,
      eventSink,
      dataAdapter
    );
  }

  return (
    <ForgeUIStoreProvider store={uiStoreRef.current}>
      <ForgeWorkspaceStoreProvider store={domainStoreRef.current}>
        <ForgeWorkspaceInner
          className={className}
          toolbarActions={toolbarActions}
          characters={characters}
        />
      </ForgeWorkspaceStoreProvider>
    </ForgeUIStoreProvider>
  );
}

function ForgeWorkspaceInner({
  characters,
  className = '',
  toolbarActions,
}: Pick<ForgeWorkspaceProps, 'characters' | 'className' | 'toolbarActions'>) {
  const showGuide = useForgeUIStore((s) => s.modals.showGuide);
  const setShowGuide = useForgeUIStore((s) => s.actions.setShowGuide);

  // Get active graph IDs and derive graphs from cache
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  
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
        onGuideClick={() => setShowGuide(true)}
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
                flagSchema={undefined}
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

      <GuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

// Public API
export { ForgeWorkspace as DialogueForge };
