'use client';

import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ForgeDataAdapter } from '@magicborn/forge/adapters/forge-data-adapter';
import {
  fetchForgeProjects,
  fetchForgeProject,
  fetchForgeGraphs,
  fetchForgeGraph,
  fetchForgePages,
  fetchForgeFlagSchema,
  fetchForgeGameStates,
  fetchForgeCharacters,
  fetchForgeCharacter,
  fetchForgePage,
  fetchForgeGameState,
  fetchActiveGameStateId,
  useCreateForgeProject,
  useCreateForgeGraph,
  useUpdateForgeGraph,
  useDeleteForgeGraph,
  useCreateForgePage,
  useUpdateForgePage,
  useDeleteForgePage,
  useCreateForgeGameState,
  useUpdateForgeGameState,
  useDeleteForgeGameState,
  useSetActiveForgeGameState,
  useCreateForgeCharacter,
  useUpdateForgeCharacter,
  useDeleteForgeCharacter,
  useCreateForgeFlagSchema,
  useUpdateForgeFlagSchema,
  useDeleteForgeFlagSchema,
} from './forge-queries';
import { ForgeDataContext } from '@magicborn/forge';

type Props = {
  children: React.ReactNode;
};

/**
 * Provides ForgeDataAdapter implemented via React Query (fetch helpers + mutations).
 * Use this instead of useForgeData() so the forge workspace gets RQ-backed data.
 */
export function ForgeDataProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const createProject = useCreateForgeProject();
  const createGraph = useCreateForgeGraph();
  const updateGraph = useUpdateForgeGraph();
  const deleteGraph = useDeleteForgeGraph();
  const createPage = useCreateForgePage();
  const updatePage = useUpdateForgePage();
  const deletePage = useDeleteForgePage();
  const createGameState = useCreateForgeGameState();
  const updateGameState = useUpdateForgeGameState();
  const deleteGameState = useDeleteForgeGameState();
  const setActiveGameState = useSetActiveForgeGameState();
  const createCharacter = useCreateForgeCharacter();
  const updateCharacter = useUpdateForgeCharacter();
  const deleteCharacter = useDeleteForgeCharacter();
  const createFlagSchema = useCreateForgeFlagSchema();
  const updateFlagSchema = useUpdateForgeFlagSchema();
  const deleteFlagSchema = useDeleteForgeFlagSchema();

  const adapter = useMemo<ForgeDataAdapter>(
    () => ({
      listProjects: () => fetchForgeProjects(queryClient),
      getProject: (projectId) => fetchForgeProject(queryClient, projectId),
      createProject: (input) => createProject.mutateAsync(input),

      listGraphs: (projectId, kind) => fetchForgeGraphs(queryClient, projectId, kind),
      getGraph: (graphId) => fetchForgeGraph(queryClient, graphId),
      createGraph: (input) => createGraph.mutateAsync(input),
      updateGraph: (graphId, patch) => updateGraph.mutateAsync({ graphId, patch }),
      deleteGraph: (graphId) => deleteGraph.mutateAsync(graphId).then(() => undefined),

      listPages: (projectId, narrativeGraphId) => fetchForgePages(queryClient, projectId, narrativeGraphId),
      getPage: (pageId) => fetchForgePage(queryClient, pageId),
      createPage: (input) => createPage.mutateAsync(input),
      updatePage: (pageId, patch) => updatePage.mutateAsync({ pageId, patch }),
      deletePage: (pageId) => deletePage.mutateAsync(pageId).then(() => undefined),

      listCharacters: (projectId) => fetchForgeCharacters(queryClient, projectId),
      getCharacter: (characterId) => fetchForgeCharacter(queryClient, characterId),
      createCharacter: (input) => createCharacter.mutateAsync(input),
      updateCharacter: (characterId, patch) => updateCharacter.mutateAsync({ characterId, patch }),
      deleteCharacter: (characterId) => deleteCharacter.mutateAsync(characterId).then(() => undefined),

      getFlagSchema: (projectId) => fetchForgeFlagSchema(queryClient, projectId),
      createFlagSchema: (input) => createFlagSchema.mutateAsync(input),
      updateFlagSchema: (flagSchemaId, patch) => updateFlagSchema.mutateAsync({ flagSchemaId, patch }),
      deleteFlagSchema: (flagSchemaId) => deleteFlagSchema.mutateAsync(flagSchemaId).then(() => undefined),

      listGameStates: (projectId) => fetchForgeGameStates(queryClient, projectId),
      getGameState: (gameStateId) => fetchForgeGameState(queryClient, gameStateId),
      getActiveGameStateId: (projectId) => fetchActiveGameStateId(queryClient, projectId),
      setActiveGameState: (projectId, gameStateId) =>
        setActiveGameState.mutateAsync({ projectId, gameStateId }).then(() => undefined),
      createGameState: (input) => createGameState.mutateAsync(input),
      updateGameState: (gameStateId, patch) => updateGameState.mutateAsync({ gameStateId, patch }),
      deleteGameState: (gameStateId) => deleteGameState.mutateAsync(gameStateId).then(() => undefined),
    }),
    [
      queryClient,
      createProject,
      createGraph,
      updateGraph,
      deleteGraph,
      createPage,
      updatePage,
      deletePage,
      createGameState,
      updateGameState,
      deleteGameState,
      setActiveGameState,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      createFlagSchema,
      updateFlagSchema,
      deleteFlagSchema,
    ]
  );

  return <ForgeDataContext.Provider value={adapter}>{children}</ForgeDataContext.Provider>;
}
