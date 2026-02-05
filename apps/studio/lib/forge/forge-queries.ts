'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ForgeGraphDoc, ForgeGraphKind, ForgeReactFlowJson } from '@magicborn/forge/types/forge-graph';
import type { ForgeProjectSummary, ForgeFlagSchema } from '@magicborn/forge/adapters/forge-data-adapter';
import type { ForgeGameState, ForgeGameStateRecord } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { ForgePage, PageType } from '@magicborn/shared/types/narrative';
import type { Project, Character, FlagSchema, ForgeGraph, GameState, Page } from '@magicborn/types';
import { PAYLOAD_COLLECTIONS } from '@/payload/collections/enums';
import { payload } from './payload';
import {
  mapProject,
  mapForgeGraph,
  mapGameStateRecord,
  mapCharacter,
  mapForgePage,
  mapFlagSchema,
  extractNarrativeGraphId,
  normalizeGameState,
} from './forge-mappers';

// Query key factories
export const forgeQueryKeys = {
  all: ['forge'] as const,
  projects: () => [...forgeQueryKeys.all, 'projects'] as const,
  project: (id: number) => [...forgeQueryKeys.all, 'project', id] as const,
  graphs: (projectId: number, kind?: ForgeGraphKind) => [...forgeQueryKeys.all, 'graphs', projectId, kind ?? 'all'] as const,
  graph: (graphId: number) => [...forgeQueryKeys.all, 'graph', graphId] as const,
  pages: (projectId: number, narrativeGraphId?: number | null) => [...forgeQueryKeys.all, 'pages', projectId, narrativeGraphId ?? 'all'] as const,
  page: (pageId: number) => [...forgeQueryKeys.all, 'page', pageId] as const,
  flagSchema: (projectId: number) => [...forgeQueryKeys.all, 'flagSchema', projectId] as const,
  gameStates: (projectId: number) => [...forgeQueryKeys.all, 'gameStates', projectId] as const,
  gameState: (id: number) => [...forgeQueryKeys.all, 'gameState', id] as const,
  characters: (projectId: number) => [...forgeQueryKeys.all, 'characters', projectId] as const,
  character: (id: number) => [...forgeQueryKeys.all, 'character', id] as const,
};

// Queries
export function useForgeProjects() {
  return useQuery({
    queryKey: forgeQueryKeys.projects(),
    queryFn: async (): Promise<ForgeProjectSummary[]> => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PROJECTS, limit: 200 });
      return result.docs.map((p) => mapProject(p as Project));
    },
  });
}

export function useForgeProject(projectId: number | null) {
  return useQuery({
    queryKey: forgeQueryKeys.project(projectId!),
    queryFn: async (): Promise<ForgeProjectSummary> => {
      const p = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId! })) as Project;
      const storyletGraphs = await payload.find({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where: { project: { equals: projectId! }, kind: { equals: 'STORYLET' } },
        limit: 200,
      });
      const storyletGraphIds = storyletGraphs.docs.map((g) => g.id as number);
      return { id: p.id, name: p.name, slug: p.slug ?? null, narrativeGraph: extractNarrativeGraphId(p), storyletGraphs: storyletGraphIds };
    },
    enabled: projectId != null,
  });
}

export function useForgeGraphs(projectId: number | null, kind?: ForgeGraphKind) {
  return useQuery({
    queryKey: forgeQueryKeys.graphs(projectId ?? 0, kind),
    queryFn: async (): Promise<ForgeGraphDoc[]> => {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (kind) (where as Record<string, unknown>).kind = { equals: kind };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, where: where as any, limit: 200 });
      return result.docs.map((g) => mapForgeGraph(g as ForgeGraph));
    },
    enabled: projectId != null,
  });
}

export function useForgeGraph(graphId: number | string | null) {
  const id = graphId == null ? null : typeof graphId === 'string' ? parseInt(graphId, 10) : graphId;
  return useQuery({
    queryKey: forgeQueryKeys.graph(Number(id)),
    queryFn: async (): Promise<ForgeGraphDoc> => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: id! })) as ForgeGraph;
      return mapForgeGraph(doc);
    },
    enabled: id != null && !Number.isNaN(id),
  });
}

export function useForgePages(projectId: number | null, narrativeGraphId?: number | null) {
  return useQuery({
    queryKey: forgeQueryKeys.pages(projectId ?? 0, narrativeGraphId),
    queryFn: async (): Promise<ForgePage[]> => {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (typeof narrativeGraphId === 'number') (where as Record<string, unknown>).narrativeGraph = { equals: narrativeGraphId };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PAGES, where: where as any, limit: 1000 });
      return result.docs.map((doc) => mapForgePage(doc as Page));
    },
    enabled: projectId != null,
  });
}

export function useForgeFlagSchema(projectId: number | null) {
  return useQuery({
    queryKey: forgeQueryKeys.flagSchema(projectId ?? 0),
    queryFn: async (): Promise<ForgeFlagSchema | null> => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, where: { project: { equals: projectId } }, limit: 1 });
      if (!result.docs.length) return null;
      return mapFlagSchema(result.docs[0] as FlagSchema);
    },
    enabled: projectId != null,
  });
}

export function useForgeGameStates(projectId: number | null) {
  return useQuery({
    queryKey: forgeQueryKeys.gameStates(projectId ?? 0),
    queryFn: async (): Promise<ForgeGameStateRecord[]> => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, where: { project: { equals: projectId } }, limit: 200 });
      return result.docs.map((doc) => mapGameStateRecord(doc as GameState));
    },
    enabled: projectId != null,
  });
}

export function useForgeCharacters(projectId: number | null) {
  return useQuery({
    queryKey: forgeQueryKeys.characters(projectId ?? 0),
    queryFn: async (): Promise<ForgeCharacter[]> => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, where: { project: { equals: projectId } }, limit: 200 });
      return result.docs.map((c) => mapCharacter(c as Character));
    },
    enabled: projectId != null,
  });
}

type QueryClientLike = {
  fetchQuery: <T>(opts: { queryKey: readonly unknown[]; queryFn: () => Promise<T> }) => Promise<T>;
};

export async function fetchForgeProjects(queryClient: QueryClientLike): Promise<ForgeProjectSummary[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.projects(),
    queryFn: async () => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PROJECTS, limit: 200 });
      return result.docs.map((p) => mapProject(p as Project));
    },
  });
}

export async function fetchForgeProject(queryClient: QueryClientLike, projectId: number): Promise<ForgeProjectSummary> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.project(projectId),
    queryFn: async () => {
      const p = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId })) as Project;
      const storyletGraphs = await payload.find({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where: { project: { equals: projectId }, kind: { equals: 'STORYLET' } },
        limit: 200,
      });
      const storyletGraphIds = storyletGraphs.docs.map((g) => g.id as number);
      return { id: p.id, name: p.name, slug: p.slug ?? null, narrativeGraph: extractNarrativeGraphId(p), storyletGraphs: storyletGraphIds };
    },
  });
}

export async function fetchForgeGraphs(
  queryClient: QueryClientLike,
  projectId: number,
  kind?: ForgeGraphKind
): Promise<ForgeGraphDoc[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.graphs(projectId, kind),
    queryFn: async () => {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (kind) (where as Record<string, unknown>).kind = { equals: kind };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, where: where as any, limit: 200 });
      return result.docs.map((g) => mapForgeGraph(g as ForgeGraph));
    },
  });
}

export async function fetchForgeGraph(queryClient: QueryClientLike, graphId: string | number): Promise<ForgeGraphDoc> {
  const id = typeof graphId === 'string' ? parseInt(graphId, 10) : graphId;
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.graph(id),
    queryFn: async () => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id })) as ForgeGraph;
      return mapForgeGraph(doc);
    },
  });
}

export async function fetchForgePages(
  queryClient: QueryClientLike,
  projectId: number,
  narrativeGraphId?: number | null
): Promise<ForgePage[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.pages(projectId, narrativeGraphId),
    queryFn: async () => {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (typeof narrativeGraphId === 'number') (where as Record<string, unknown>).narrativeGraph = { equals: narrativeGraphId };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PAGES, where: where as any, limit: 1000 });
      return result.docs.map((doc) => mapForgePage(doc as Page));
    },
  });
}

export async function fetchForgeFlagSchema(queryClient: QueryClientLike, projectId: number): Promise<ForgeFlagSchema | null> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.flagSchema(projectId),
    queryFn: async () => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, where: { project: { equals: projectId } }, limit: 1 });
      if (!result.docs.length) return null;
      return mapFlagSchema(result.docs[0] as FlagSchema);
    },
  });
}

export async function fetchForgeGameStates(queryClient: QueryClientLike, projectId: number): Promise<ForgeGameStateRecord[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.gameStates(projectId),
    queryFn: async () => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, where: { project: { equals: projectId } }, limit: 200 });
      return result.docs.map((doc) => mapGameStateRecord(doc as GameState));
    },
  });
}

export async function fetchForgeCharacters(queryClient: QueryClientLike, projectId: number): Promise<ForgeCharacter[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.characters(projectId),
    queryFn: async () => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, where: { project: { equals: projectId } }, limit: 200 });
      return result.docs.map((c) => mapCharacter(c as Character));
    },
  });
}

export async function fetchForgeCharacter(queryClient: QueryClientLike, characterId: number): Promise<ForgeCharacter> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.character(characterId),
    queryFn: async () => {
      const char = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId })) as Character;
      return mapCharacter(char);
    },
  });
}

export async function fetchForgePage(queryClient: QueryClientLike, pageId: number): Promise<ForgePage> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.page(pageId),
    queryFn: async () => mapForgePage((await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page),
  });
}

export async function fetchForgeGameState(queryClient: QueryClientLike, gameStateId: number): Promise<ForgeGameStateRecord> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.gameState(gameStateId),
    queryFn: async () => mapGameStateRecord((await payload.findByID({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId })) as GameState),
  });
}

export async function fetchActiveGameStateId(queryClient: QueryClientLike, projectId: number): Promise<number | null> {
  const project = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId })) as Project;
  const settings = (project.settings as { activeGameStateId?: number | null } | null | undefined) ?? {};
  const activeId = settings?.activeGameStateId;
  return typeof activeId === 'number' ? activeId : null;
}

// Mutations
export function useCreateForgeProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string | null }) => {
      const result = (await payload.create({ collection: PAYLOAD_COLLECTIONS.PROJECTS, data: data as any })) as Project;
      return mapProject(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.projects() });
    },
  });
}

export function useCreateForgeGraph() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: number;
      kind: ForgeGraphKind;
      title: string;
      flow: ForgeReactFlowJson;
      startNodeId: string;
      endNodeIds: { nodeId: string; exitKey?: string }[];
    }) => {
      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        data: { project: input.projectId, kind: input.kind, title: input.title, flow: input.flow, startNodeId: input.startNodeId, endNodeIds: input.endNodeIds },
      })) as ForgeGraph;
      if (!doc.project) (doc as ForgeGraph & { project?: number }).project = input.projectId;
      return mapForgeGraph(doc);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graphs(data.project) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graph(data.id) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.project(data.project) });
    },
  });
}

export function useUpdateForgeGraph() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      graphId,
      patch,
    }: {
      graphId: number;
      patch: Partial<Pick<ForgeGraphDoc, 'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>>;
    }) => {
      const doc = (await payload.update({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: graphId, data: patch })) as ForgeGraph;
      return mapForgeGraph(doc);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graphs(data.project) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graph(data.id) });
    },
  });
}

export function useDeleteForgeGraph() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (graphId: number) => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: graphId })) as ForgeGraph;
      const projectId = typeof doc.project === 'number' ? doc.project : (doc.project as { id?: number })?.id;
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: graphId });
      return { graphId, projectId: projectId ?? undefined };
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.graph(data.graphId) });
      if (data.projectId != null) {
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graphs(data.projectId) });
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.project(data.projectId) });
      }
    },
  });
}

export function useCreateForgePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: number;
      pageType: PageType;
      title: string;
      order: number;
      parent?: number | null;
      narrativeGraph?: number | null;
    }) => {
      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        data: {
          project: input.projectId,
          pageType: input.pageType,
          title: input.title,
          order: input.order,
          parent: input.parent ?? null,
          narrativeGraph: input.narrativeGraph ?? null,
          _status: 'draft',
        } as any,
      })) as unknown as Page;
      return mapForgePage(doc);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.pages(data.project, data.narrativeGraph ?? undefined) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.page(data.id) });
    },
  });
}

export function useUpdateForgePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, patch }: { pageId: number; patch: Partial<ForgePage> }) => {
      return mapForgePage((await payload.update({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId, data: patch as any })) as unknown as Page);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.pages(data.project, data.narrativeGraph ?? undefined) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.page(data.id) });
    },
  });
}

export function useDeleteForgePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: number) => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page & { narrativeGraph?: number | { id: number } | null };
      const projectId = typeof doc.project === 'number' ? doc.project : (doc.project as { id?: number })?.id;
      const narrativeGraphId = doc.narrativeGraph == null ? null : typeof doc.narrativeGraph === 'number' ? doc.narrativeGraph : (doc.narrativeGraph as { id?: number })?.id ?? null;
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId });
      return { pageId, projectId: projectId ?? undefined, narrativeGraphId };
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.page(data.pageId) });
      if (data.projectId != null) {
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.pages(data.projectId, data.narrativeGraphId ?? undefined) });
      }
    },
  });
}

export function useCreateForgeGameState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: number; name: string; state: ForgeGameState }) => {
      return mapGameStateRecord(
        (await payload.create({
          collection: PAYLOAD_COLLECTIONS.GAME_STATES,
          data: { project: input.projectId, type: 'AUTHORED', playerKey: input.name, state: input.state } as any,
        })) as unknown as GameState
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.gameStates(data.projectId) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.project(data.projectId) });
    },
  });
}

export function useUpdateForgeGameState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ gameStateId, patch }: { gameStateId: number; patch: Partial<ForgeGameState> }) => {
      return mapGameStateRecord((await payload.update({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId, data: { state: patch } })) as GameState);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.gameStates(data.projectId) });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.gameState(data.id) });
    },
  });
}

export function useDeleteForgeGameState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameStateId: number) => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId })) as GameState;
      const projectId = typeof doc.project === 'number' ? doc.project : (doc.project as { id?: number })?.id;
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId });
      return { gameStateId, projectId: projectId ?? undefined };
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.gameState(data.gameStateId) });
      if (data.projectId != null) {
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.gameStates(data.projectId) });
      }
    },
  });
}

export function useSetActiveForgeGameState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, gameStateId }: { projectId: number; gameStateId: number }) => {
      const project = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId })) as Project;
      const settings = (project.settings as Record<string, unknown> | null | undefined) ?? {};
      await payload.update({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
        data: { settings: { ...settings, activeGameStateId: gameStateId } },
      });
      return { projectId, gameStateId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.project(data.projectId) });
    },
  });
}

export function useCreateForgeCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: number; name: string; avatar?: number | null; meta?: unknown }) => {
      return mapCharacter(
        (await payload.create({
          collection: PAYLOAD_COLLECTIONS.CHARACTERS,
          data: { project: input.projectId, name: input.name, avatar: input.avatar ?? null, meta: input.meta ?? undefined } as any,
        })) as Character
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.characters(variables.projectId) });
    },
  });
}

export function useUpdateForgeCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, patch }: { characterId: number; patch: Partial<ForgeCharacter> }) => {
      const updated = (await payload.update({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId, data: patch as any })) as Character;
      const projectId = typeof updated.project === 'number' ? updated.project : (updated.project as { id?: number })?.id;
      return { ...mapCharacter(updated), projectId: projectId ?? undefined };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.character(Number(data.id)) });
      if (data.projectId != null) queryClient.invalidateQueries({ queryKey: forgeQueryKeys.characters(data.projectId) });
    },
  });
}

export function useDeleteForgeCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (characterId: number) => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId })) as Character;
      const projectId = typeof doc.project === 'number' ? doc.project : (doc.project as { id?: number })?.id;
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId });
      return { characterId, projectId: projectId ?? undefined };
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.character(data.characterId) });
      if (data.projectId != null) queryClient.invalidateQueries({ queryKey: forgeQueryKeys.characters(data.projectId) });
    },
  });
}

export function useCreateForgeFlagSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: number; schema: unknown }) => {
      const result = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        data: { project: input.projectId, schema: input.schema } as any,
      })) as FlagSchema;
      return mapFlagSchema(result);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.flagSchema(variables.projectId) });
    },
  });
}

export function useUpdateForgeFlagSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ flagSchemaId, patch }: { flagSchemaId: number; patch: Partial<ForgeFlagSchema> }) => {
      const result = (await payload.update({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, id: flagSchemaId, data: patch as any })) as FlagSchema;
      return mapFlagSchema(result);
    },
    onSuccess: (data, _, context) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.all });
    },
  });
}

export function useDeleteForgeFlagSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (flagSchemaId: number) => {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, id: flagSchemaId })) as FlagSchema;
      const projectId = typeof doc.project === 'number' ? doc.project : (doc.project as { id?: number })?.id;
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, id: flagSchemaId });
      return { flagSchemaId, projectId: projectId ?? undefined };
    },
    onSuccess: (data) => {
      if (data.projectId != null) queryClient.invalidateQueries({ queryKey: forgeQueryKeys.flagSchema(data.projectId) });
    },
  });
}
