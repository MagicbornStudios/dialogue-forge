import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import { FORGE_GRAPH_KIND } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { FlagSchema } from '@magicborn/forge/types/flags';
import {
  ForgeWorkspaceStoreProvider,
  createForgeWorkspaceStore,
  useForgeWorkspaceStore,
  type EventSink,
} from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { commitForgeDraft } from '@magicborn/forge/components/ForgeWorkspace/store/slices/draft.slice';
import { ForgeWorkspaceMenuBar } from '@magicborn/forge/components/ForgeWorkspace/components/ForgeWorkspaceMenuBar';
import { ProjectSync } from '@magicborn/forge/components/ForgeWorkspace/components/ProjectSync';
import { ForgeWorkspaceLayout } from '@magicborn/forge/components/ForgeWorkspace/components/ForgeWorkspaceLayout';
import { ForgeWorkspaceModalsRenderer } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeWorkspaceModals';
import type {
  RequestPlayerCompositionInput,
  RequestPlayerCompositionResult,
} from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgePlayerModal';
import { NodeDragProvider } from '@magicborn/forge/components/ForgeWorkspace/hooks/useNodeDrag';
import { CommandBar, useCommandBar } from './components/CommandBar/CommandBar';
import { TooltipProvider } from '@magicborn/shared/ui/tooltip';
import type { ForgeEvent } from '@magicborn/forge/events/events';
import {
  fetchForgeGraph,
  useActiveForgeGameStateId,
  useCreateForgeGameState,
  useCreateForgeGraph,
  useCreateForgePage,
  useForgeCharacters,
  useForgeFlagSchema,
  useForgeGameStates,
  useForgeGraphs,
  useSetActiveForgeGameState,
  useUpdateForgeGraph,
} from '@magicborn/forge/data/forge-queries';
import { useForgePayloadClient } from '@magicborn/forge/data/ForgePayloadContext';

export interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string;
}

interface ForgeWorkspaceProps {
  narrativeGraph?: ForgeGraphDoc | null;
  storyletGraph?: ForgeGraphDoc | null;
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  gameState?: ForgeGameState;
  className?: string;
  onEvent?: (event: ForgeEvent) => void;
  resolveGraph?: (graphId: string) => Promise<ForgeGraphDoc>;
  selectedProjectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
  headerLinks?: HeaderLink[];
  requestPlayerComposition?: (
    rootGraphId: number,
    payload?: RequestPlayerCompositionInput
  ) => Promise<RequestPlayerCompositionResult>;
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
  selectedProjectId,
  headerLinks,
  requestPlayerComposition,
}: ForgeWorkspaceProps) {
  const queryClient = useQueryClient();
  const payloadClient = useForgePayloadClient();
  const createPage = useCreateForgePage();
  const updateGraph = useUpdateForgeGraph();

  const resolveGraphPropRef = useRef(resolveGraph);
  resolveGraphPropRef.current = resolveGraph;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const payloadClientRef = useRef(payloadClient);
  payloadClientRef.current = payloadClient;
  const createPageRef = useRef(createPage);
  createPageRef.current = createPage;
  const updateGraphRef = useRef(updateGraph);
  updateGraphRef.current = updateGraph;

  const resolveGraphFn = useCallback((id: string) => {
    if (resolveGraphPropRef.current) return resolveGraphPropRef.current(id);
    return fetchForgeGraph(queryClientRef.current, payloadClientRef.current, id);
  }, []);

  const onCommitDraftFn = useCallback(
    (
      draft: ForgeGraphDoc,
      deltas: import('@magicborn/forge/components/ForgeWorkspace/store/slices/draft.slice').ForgeDraftDelta[]
    ) =>
      commitForgeDraft(draft, deltas, {
        createPage: (input) => createPageRef.current.mutateAsync(input),
        updateGraph: (graphId, patch) =>
          updateGraphRef.current.mutateAsync({ graphId, patch }),
      }),
    []
  );

  const eventSinkRef = useRef<EventSink>({
    emit: (event) => {
      onEvent?.(event);
    },
  });

  const storeRef = useRef(
    createForgeWorkspaceStore(
      {
        initialNarrativeGraph: narrativeGraph ?? null,
        initialStoryletGraph: storyletGraph ?? null,
        initialFlagSchema,
        initialGameState,
        resolveGraph: resolveGraphFn,
        onCommitDraft: onCommitDraftFn,
      },
      eventSinkRef.current
    )
  );

  return (
    <ForgeWorkspaceStoreProvider store={storeRef.current}>
      <TooltipProvider>
        <NodeDragProvider>
          <ProjectSync selectedProjectId={selectedProjectId} />
          <ForgeWorkspaceContent
            characters={initialCharacters}
            className={className}
            headerLinks={headerLinks}
            requestPlayerComposition={requestPlayerComposition}
          />
        </NodeDragProvider>
      </TooltipProvider>
    </ForgeWorkspaceStoreProvider>
  );
}

type PanelId = 'sidebar' | 'narrative-editor' | 'storylet-editor';

function ForgeWorkspaceContent({
  characters,
  className = '',
  headerLinks,
  requestPlayerComposition,
}: Pick<
  ForgeWorkspaceProps,
  'characters' | 'className' | 'headerLinks' | 'requestPlayerComposition'
>) {
  const selectedProjectId = useForgeWorkspaceStore((state) => state.selectedProjectId);
  const activeNarrativeGraphId = useForgeWorkspaceStore(
    (state) => state.activeNarrativeGraphId
  );
  const activeStoryletGraphId = useForgeWorkspaceStore(
    (state) => state.activeStoryletGraphId
  );
  const activeFlagSchema = useForgeWorkspaceStore((state) => state.activeFlagSchema);
  const activeGameState = useForgeWorkspaceStore((state) => state.activeGameState);
  const narrativeGraph = useForgeWorkspaceStore((state) =>
    activeNarrativeGraphId ? state.graphs.byId[activeNarrativeGraphId] ?? null : null
  );
  const storyletGraph = useForgeWorkspaceStore((state) =>
    activeStoryletGraphId ? state.graphs.byId[activeStoryletGraphId] ?? null : null
  );

  const setGraph = useForgeWorkspaceStore((state) => state.actions.setGraph);
  const setGraphs = useForgeWorkspaceStore((state) => state.actions.setGraphs);
  const setActiveFlagSchema = useForgeWorkspaceStore(
    (state) => state.actions.setActiveFlagSchema
  );
  const setActiveGameState = useForgeWorkspaceStore(
    (state) => state.actions.setActiveGameState
  );
  const setActiveNarrativeGraphId = useForgeWorkspaceStore(
    (state) => state.actions.setActiveNarrativeGraphId
  );
  const setActiveStoryletGraphId = useForgeWorkspaceStore(
    (state) => state.actions.setActiveStoryletGraphId
  );
  const setGameStates = useForgeWorkspaceStore((state) => state.actions.setGameStates);
  const openGraphInScope = useForgeWorkspaceStore((state) => state.actions.openGraphInScope);

  const narrativeGraphsQuery = useForgeGraphs(
    selectedProjectId ?? null,
    FORGE_GRAPH_KIND.NARRATIVE
  );
  const storyletGraphsQuery = useForgeGraphs(
    selectedProjectId ?? null,
    FORGE_GRAPH_KIND.STORYLET
  );
  const flagSchemaQuery = useForgeFlagSchema(selectedProjectId ?? null);
  const gameStatesQuery = useForgeGameStates(selectedProjectId ?? null);
  const activeGameStateIdQuery = useActiveForgeGameStateId(selectedProjectId ?? null);
  const charactersQuery = useForgeCharacters(selectedProjectId ?? null);

  const createGameState = useCreateForgeGameState();
  const setActiveForgeGameState = useSetActiveForgeGameState();
  const createGraph = useCreateForgeGraph();
  const updateGraph = useUpdateForgeGraph();

  const [panelVisibility, setPanelVisibility] = useState<Record<PanelId, boolean>>({
    sidebar: true,
    'narrative-editor': true,
    'storylet-editor': true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('forge-panel-visibility');
    if (!saved) return;
    try {
      setPanelVisibility(JSON.parse(saved));
    } catch {
      // Ignore malformed panel visibility snapshots.
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forge-panel-visibility', JSON.stringify(panelVisibility));
    }
  }, [panelVisibility]);

  useEffect(() => {
    if (!selectedProjectId) {
      setActiveNarrativeGraphId(null);
      setActiveStoryletGraphId(null);
      setActiveFlagSchema(undefined, null);
      setGameStates([], null, null);
      return;
    }

    const narrativeGraphs = narrativeGraphsQuery.data ?? [];
    const storyletGraphs = storyletGraphsQuery.data ?? [];

    if (narrativeGraphs.length) {
      setGraphs(narrativeGraphs);
      const hasCurrent = activeNarrativeGraphId
        ? narrativeGraphs.some((graph) => String(graph.id) === activeNarrativeGraphId)
        : false;
      if (!hasCurrent) {
        setActiveNarrativeGraphId(String(narrativeGraphs[0].id));
      }
    }

    if (storyletGraphs.length) {
      setGraphs(storyletGraphs);
      const hasCurrent = activeStoryletGraphId
        ? storyletGraphs.some((graph) => String(graph.id) === activeStoryletGraphId)
        : false;
      if (!hasCurrent) {
        setActiveStoryletGraphId(String(storyletGraphs[0].id));
      }
    }
  }, [
    activeNarrativeGraphId,
    activeStoryletGraphId,
    narrativeGraphsQuery.data,
    selectedProjectId,
    setActiveNarrativeGraphId,
    setActiveStoryletGraphId,
    setActiveFlagSchema,
    setGameStates,
    setGraphs,
    storyletGraphsQuery.data,
  ]);

  useEffect(() => {
    if (!selectedProjectId) return;
    if (!flagSchemaQuery.isSuccess) return;
    const schema = flagSchemaQuery.data?.schema as FlagSchema | undefined;
    setActiveFlagSchema(schema, selectedProjectId);
  }, [flagSchemaQuery.data, flagSchemaQuery.isSuccess, selectedProjectId, setActiveFlagSchema]);

  const creatingDefaultStateProjectRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedProjectId || !gameStatesQuery.isSuccess) return;

    let cancelled = false;
    const syncStates = async () => {
      let states = gameStatesQuery.data ?? [];
      let activeGameStateId = activeGameStateIdQuery.data ?? null;

      if (!states.length) {
        if (creatingDefaultStateProjectRef.current === selectedProjectId) return;
        creatingDefaultStateProjectRef.current = selectedProjectId;
        try {
          const created = await createGameState.mutateAsync({
            projectId: selectedProjectId,
            name: 'Default State',
            state: { flags: {} },
          });
          await setActiveForgeGameState.mutateAsync({
            projectId: selectedProjectId,
            gameStateId: created.id,
          });
          states = [created];
          activeGameStateId = created.id;
        } catch (error) {
          console.error('Failed to create default game state:', error);
          return;
        } finally {
          creatingDefaultStateProjectRef.current = null;
        }
      } else if (
        !activeGameStateId ||
        !states.some((gameState) => gameState.id === activeGameStateId)
      ) {
        activeGameStateId = states[0].id;
        try {
          await setActiveForgeGameState.mutateAsync({
            projectId: selectedProjectId,
            gameStateId: activeGameStateId,
          });
        } catch (error) {
          console.error('Failed to set active game state:', error);
        }
      }

      if (!cancelled) {
        setGameStates(states, selectedProjectId, activeGameStateId);
      }
    };

    void syncStates();
    return () => {
      cancelled = true;
    };
  }, [
    activeGameStateIdQuery.data,
    createGameState,
    gameStatesQuery.data,
    gameStatesQuery.isSuccess,
    selectedProjectId,
    setActiveForgeGameState,
    setGameStates,
  ]);

  const effectiveCharacters = useMemo(() => {
    if (characters && Object.keys(characters).length) return characters;
    const fromQuery = charactersQuery.data ?? [];
    return fromQuery.reduce<Record<string, ForgeCharacter>>((acc, character) => {
      acc[String(character.id)] = character;
      return acc;
    }, {});
  }, [characters, charactersQuery.data]);

  const onNarrativeGraphChange = useCallback(
    async (next: ForgeGraphDoc) => {
      setGraph(String(next.id), next);

      if (next.id === 0 && selectedProjectId && next.flow.nodes.length > 0) {
        try {
          const createdGraph = await createGraph.mutateAsync({
            projectId: selectedProjectId,
            kind: next.kind,
            title: next.title || '',
            flow: next.flow,
            startNodeId: next.startNodeId,
            endNodeIds: next.endNodeIds,
          });

          const graphIdStr = String(createdGraph.id);
          const defaultTitle = `New Graph ${graphIdStr.slice(0, 4)}`;
          const finalTitle = createdGraph.title || defaultTitle;

          if (!createdGraph.title) {
            await updateGraph.mutateAsync({
              graphId: createdGraph.id,
              patch: { title: finalTitle },
            });
          }

          const updatedGraph = { ...next, id: createdGraph.id, title: finalTitle };
          setGraph(String(createdGraph.id), updatedGraph);
          setActiveNarrativeGraphId(String(createdGraph.id));

          setTimeout(() => {
            void openGraphInScope('narrative', String(createdGraph.id), {
              pushBreadcrumb: true,
            });
          }, 0);
        } catch (error) {
          console.error('Failed to create graph:', error);
          alert('Failed to create graph. Please try again.');
        }
        return;
      }

      if (next.id === 0) return;
      try {
        await updateGraph.mutateAsync({
          graphId: next.id,
          patch: {
            flow: next.flow,
            startNodeId: next.startNodeId,
            endNodeIds: next.endNodeIds,
            title: next.title,
          },
        });
      } catch (error) {
        console.error('Failed to save graph:', error);
      }
    },
    [
      createGraph,
      openGraphInScope,
      selectedProjectId,
      setActiveNarrativeGraphId,
      setGraph,
      updateGraph,
    ]
  );

  const onStoryletGraphChange = useCallback(
    async (next: ForgeGraphDoc) => {
      setGraph(String(next.id), next);

      if (next.id === 0 && selectedProjectId && next.flow.nodes.length > 0) {
        try {
          const createdGraph = await createGraph.mutateAsync({
            projectId: selectedProjectId,
            kind: next.kind,
            title: next.title || '',
            flow: next.flow,
            startNodeId: next.startNodeId,
            endNodeIds: next.endNodeIds,
          });

          const graphIdStr = String(createdGraph.id);
          const defaultTitle = `New Graph ${graphIdStr.slice(0, 4)}`;
          const finalTitle = createdGraph.title || defaultTitle;

          if (!createdGraph.title) {
            await updateGraph.mutateAsync({
              graphId: createdGraph.id,
              patch: { title: finalTitle },
            });
          }

          const updatedGraph = { ...next, id: createdGraph.id, title: finalTitle };
          setGraph(String(createdGraph.id), updatedGraph);
          setActiveStoryletGraphId(String(createdGraph.id));

          setTimeout(() => {
            void openGraphInScope('storylet', String(createdGraph.id), {
              pushBreadcrumb: true,
            });
          }, 0);
        } catch (error) {
          console.error('Failed to create graph:', error);
          alert('Failed to create graph. Please try again.');
        }
        return;
      }

      if (next.id === 0) return;
      try {
        await updateGraph.mutateAsync({
          graphId: next.id,
          patch: {
            flow: next.flow,
            startNodeId: next.startNodeId,
            endNodeIds: next.endNodeIds,
            title: next.title,
          },
        });
      } catch (error) {
        console.error('Failed to save graph:', error);
      }
    },
    [
      createGraph,
      openGraphInScope,
      selectedProjectId,
      setActiveStoryletGraphId,
      setGraph,
      updateGraph,
    ]
  );

  const togglePanel = useCallback((panelId: PanelId) => {
    setPanelVisibility((prev) => ({ ...prev, [panelId]: !prev[panelId] }));
  }, []);

  const openFlagModal = useForgeWorkspaceStore((state) => state.actions.openFlagModal);
  const openGuide = useForgeWorkspaceStore((state) => state.actions.openGuide);
  const openPlayerModal = useForgeWorkspaceStore((state) => state.actions.openPlayerModal);
  const { open: commandBarOpen, setOpen: setCommandBarOpen } = useCommandBar();

  const handleUpdateFlagSchema = useCallback(
    (schema: FlagSchema) => {
      setActiveFlagSchema(schema, selectedProjectId);
    },
    [selectedProjectId, setActiveFlagSchema]
  );

  const handleUpdateGameState = useCallback(
    (state: ForgeGameState) => {
      setActiveGameState(state, selectedProjectId);
    },
    [selectedProjectId, setActiveGameState]
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
        counts={{
          actCount: 0,
          chapterCount: 0,
          pageCount: 0,
          characterCount: Object.keys(effectiveCharacters).length,
        }}
        onGuideClick={openGuide}
        onFlagClick={openFlagModal}
        onPlayClick={openPlayerModal}
        panelVisibility={panelVisibility}
        onTogglePanel={togglePanel}
        headerLinks={headerLinks}
      />

      <CommandBar open={commandBarOpen} onOpenChange={setCommandBarOpen} />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ForgeWorkspaceLayout
          panelVisibility={panelVisibility}
          narrativeGraph={narrativeGraph}
          storyletGraph={storyletGraph}
          flagSchema={activeFlagSchema}
          gameState={activeGameState}
          characters={effectiveCharacters}
          onNarrativeGraphChange={onNarrativeGraphChange}
          onStoryletGraphChange={onStoryletGraphChange}
        />
      </div>

      <ForgeWorkspaceModalsRenderer
        narrativeGraph={narrativeGraph}
        storyletGraph={storyletGraph}
        flagSchema={activeFlagSchema}
        gameState={activeGameState}
        characters={effectiveCharacters}
        onUpdateFlagSchema={handleUpdateFlagSchema}
        onUpdateGameState={handleUpdateGameState}
        requestPlayerComposition={requestPlayerComposition}
      />
    </div>
  );
}
