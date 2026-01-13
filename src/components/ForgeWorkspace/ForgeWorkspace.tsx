// src/components/ForgeWorkspace/ForgeWorkspace.tsx
import React, { useRef, useCallback } from 'react';
import type { ForgeGraphDoc } from '../../types';
import type { BaseGameState } from '../../types/game-state';
import type { Character } from '../../types/characters';
import type { FlagSchema } from '../../types/flags';

import { GuidePanel } from '../shared/GuidePanel';
import { ForgeWorkspaceToolbar } from './components/ForgeWorkspaceToolbar';
import { NarrativeGraphSection } from './components/NarrativeGraphSection';
import { StoryletGraphSection } from './components/StoryletGraphSection';

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
import { VIEW_MODE } from '@/src/types/constants';

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

  // Pull graphs from the domain store.
  // If your slice is still `dialogue.byId`, keep it until you rename.
  const narrativeGraph = useForgeWorkspaceStore((s) => (s as any).graphs?.narrative ?? null);
  const storyletGraph = useForgeWorkspaceStore((s) => (s as any).graphs?.storylet ?? null);

  const setNarrativeGraph = useForgeWorkspaceStore((s) => (s as any).actions?.setNarrativeGraph);
  const setStoryletGraph = useForgeWorkspaceStore((s) => (s as any).actions?.setStoryletGraph);

  const onNarrativeGraphChange = useCallback(
    (next: ForgeGraphDoc) => {
      setNarrativeGraph?.(next);
    },
    [setNarrativeGraph]
  );

  const onStoryletGraphChange = useCallback(
    (next: ForgeGraphDoc) => {
      setStoryletGraph?.(next);
    },
    [setStoryletGraph]
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        {narrativeGraph ? (
          <NarrativeGraphSection 
          graph={narrativeGraph} 
          onGraphChange={onNarrativeGraphChange} />
        ) : (
          <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-3 text-sm text-df-text-secondary">
            No narrative graph loaded.
          </div>
        )}

        {storyletGraph ? (
          <StoryletGraphSection
          graph={storyletGraph}
          onGraphChange={onStoryletGraphChange}
          />
        ) : (
          <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-3 text-sm text-df-text-secondary">
            No storylet graph loaded.
          </div>
        )}
      </div>

      <GuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

// Public API
export { ForgeWorkspace as DialogueForge };
