'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ForgeGraphDoc,
  ForgeGraphKind,
  ForgeReactFlowJson,
} from '@magicborn/forge/types/forge-graph';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type {
  ForgeGameState,
  ForgeGameStateRecord,
} from '@magicborn/shared/types/forge-game-state';
import type { ForgePage, PageType } from '@magicborn/shared/types/narrative';
import { useForgePayloadClient } from './ForgePayloadContext';
import { PAYLOAD_COLLECTIONS } from './payload-collections';
import {
  extractActiveGameStateId,
  extractNarrativeGraphId,
  mapCharacter,
  mapFlagSchema,
  mapForgeGraph,
  mapForgePage,
  mapGameStateRecord,
  mapProject,
} from './forge-mappers';
import type { ForgeFlagSchema, ForgeProjectSummary } from './forge-types';

type PayloadProject = {
  id: number;
  name: string;
  slug?: string | null;
  narrativeGraph?: number | { id?: number } | null;
  settings?: Record<string, unknown> | null;
};

type PayloadGraph = {
  id: number;
  project: number | { id?: number };
  kind: string;
  title: string;
  flow: unknown;
  startNodeId: string;
  endNodeIds: Array<{ nodeId: string; exitKey?: string | null }>;
  compiledYarn?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PayloadPage = {
  id: number;
  pageType: string;
  title: string;
  summary?: string | null;
  order: number;
  project: number | { id?: number };
  parent?: number | { id?: number } | null;
  narrativeGraph?: number | { id?: number } | null;
  dialogueGraph?: number | { id?: number } | null;
  bookHeading?: string | null;
  bookBody?: string | Record<string, unknown> | null;
  content?: unknown;
  archivedAt?: string | null;
};

type PayloadFlagSchema = {
  id: number;
  schema: unknown;
  project: number | { id?: number };
};

type PayloadCharacter = {
  id: number | string;
  name?: string;
  avatar?: number | { id?: number } | string | null;
  meta?: unknown;
  project?: number | { id?: number } | null;
};

type PayloadGameState = {
  id: number;
  project: number | { id?: number };
  playerKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  state?: unknown;
};

type QueryClientLike = {
  fetchQuery: <T>(opts: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<T>;
  }) => Promise<T>;
};

const listDocs = async <T>(
  find: (args: {
    collection: string;
    where?: Record<string, unknown>;
    limit?: number;
    depth?: number;
  }) => Promise<{ docs: unknown[] }>,
  args: {
    collection: string;
    where?: Record<string, unknown>;
    limit?: number;
    depth?: number;
  }
): Promise<T[]> => {
  const result = await find(args);
  return (result.docs ?? []) as T[];
};

export const forgeQueryKeys = {
  all: ['forge'] as const,
  projects: () => [...forgeQueryKeys.all, 'projects'] as const,
  project: (id: number) => [...forgeQueryKeys.all, 'project', id] as const,
  graphs: (projectId: number, kind?: ForgeGraphKind) =>
    [...forgeQueryKeys.all, 'graphs', projectId, kind ?? 'all'] as const,
  graph: (graphId: number) => [...forgeQueryKeys.all, 'graph', graphId] as const,
  pages: (projectId: number, narrativeGraphId?: number | null) =>
    [...forgeQueryKeys.all, 'pages', projectId, narrativeGraphId ?? 'all'] as const,
  page: (pageId: number) => [...forgeQueryKeys.all, 'page', pageId] as const,
  flagSchema: (projectId: number) =>
    [...forgeQueryKeys.all, 'flagSchema', projectId] as const,
  gameStates: (projectId: number) =>
    [...forgeQueryKeys.all, 'gameStates', projectId] as const,
  gameState: (id: number) => [...forgeQueryKeys.all, 'gameState', id] as const,
  activeGameStateId: (projectId: number) =>
    [...forgeQueryKeys.all, 'activeGameStateId', projectId] as const,
  characters: (projectId: number) =>
    [...forgeQueryKeys.all, 'characters', projectId] as const,
  character: (id: number) => [...forgeQueryKeys.all, 'character', id] as const,
};

export function useForgeProjects() {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.projects(),
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    queryFn: async (): Promise<ForgeProjectSummary[]> => {
      const projects = await listDocs<PayloadProject>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        limit: 200,
        depth: 0,
      });
      return projects.map((project) => {
        const mapped = mapProject(project);
        const narrativeGraph = extractNarrativeGraphId(project);
        return { ...mapped, narrativeGraph };
      });
    },
  });
}

export function useForgeProject(projectId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.project(projectId ?? 0),
    queryFn: async (): Promise<ForgeProjectSummary> => {
      const project = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId!,
      })) as PayloadProject;
      const storyletGraphs = await listDocs<PayloadGraph>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where: {
          project: { equals: projectId! },
          kind: { equals: 'STORYLET' },
        },
        limit: 200,
      });
      return {
        ...mapProject(project),
        narrativeGraph: extractNarrativeGraphId(project),
        storyletGraphs: storyletGraphs.map((graph) => graph.id),
        activeGameStateId: extractActiveGameStateId(project),
      };
    },
    enabled: projectId != null,
  });
}

export function useForgeGraphs(projectId: number | null, kind?: ForgeGraphKind) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.graphs(projectId ?? 0, kind),
    queryFn: async (): Promise<ForgeGraphDoc[]> => {
      const where: Record<string, unknown> = {
        project: { equals: projectId },
      };
      if (kind) where.kind = { equals: kind };
      const graphs = await listDocs<PayloadGraph>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where,
        limit: 200,
      });
      return graphs.map(mapForgeGraph);
    },
    enabled: projectId != null,
  });
}

export function useForgeGraph(graphId: number | string | null) {
  const payload = useForgePayloadClient();
  const id =
    graphId == null
      ? null
      : typeof graphId === 'string'
        ? parseInt(graphId, 10)
        : graphId;

  return useQuery({
    queryKey: forgeQueryKeys.graph(id ?? 0),
    queryFn: async (): Promise<ForgeGraphDoc> => {
      const graph = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: id!,
      })) as PayloadGraph;
      return mapForgeGraph(graph);
    },
    enabled: id != null && !Number.isNaN(id),
  });
}

export function useForgePages(
  projectId: number | null,
  narrativeGraphId?: number | null
) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.pages(projectId ?? 0, narrativeGraphId),
    queryFn: async (): Promise<ForgePage[]> => {
      const where: Record<string, unknown> = {
        project: { equals: projectId },
      };
      if (typeof narrativeGraphId === 'number') {
        where.narrativeGraph = { equals: narrativeGraphId };
      }
      const pages = await listDocs<PayloadPage>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.PAGES,
        where,
        limit: 1000,
      });
      return pages.map(mapForgePage).sort((a, b) => a.order - b.order);
    },
    enabled: projectId != null,
  });
}

export function useForgeFlagSchema(projectId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.flagSchema(projectId ?? 0),
    queryFn: async (): Promise<ForgeFlagSchema | null> => {
      const docs = await listDocs<PayloadFlagSchema>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        where: { project: { equals: projectId } },
        limit: 1,
      });
      if (!docs.length) return null;
      return mapFlagSchema(docs[0]);
    },
    enabled: projectId != null,
  });
}

export function useForgeGameStates(projectId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.gameStates(projectId ?? 0),
    queryFn: async (): Promise<ForgeGameStateRecord[]> => {
      const docs = await listDocs<PayloadGameState>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        where: { project: { equals: projectId } },
        limit: 200,
      });
      return docs.map(mapGameStateRecord);
    },
    enabled: projectId != null,
  });
}

export function useActiveForgeGameStateId(projectId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.activeGameStateId(projectId ?? 0),
    queryFn: async (): Promise<number | null> => {
      const project = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId!,
      })) as PayloadProject;
      return extractActiveGameStateId(project);
    },
    enabled: projectId != null,
  });
}

export function useForgeCharacters(projectId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: forgeQueryKeys.characters(projectId ?? 0),
    queryFn: async (): Promise<ForgeCharacter[]> => {
      const docs = await listDocs<PayloadCharacter>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        where: { project: { equals: projectId } },
        limit: 200,
      });
      return docs.map(mapCharacter);
    },
    enabled: projectId != null,
  });
}

export async function fetchForgeProjects(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>
): Promise<ForgeProjectSummary[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.projects(),
    queryFn: async () => {
      const projects = await listDocs<PayloadProject>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        limit: 200,
        depth: 0,
      });
      return projects.map(mapProject);
    },
  });
}

export async function fetchForgeProject(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number
): Promise<ForgeProjectSummary> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.project(projectId),
    queryFn: async () => {
      const project = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
      })) as PayloadProject;
      const storyletGraphs = await listDocs<PayloadGraph>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where: {
          project: { equals: projectId },
          kind: { equals: 'STORYLET' },
        },
        limit: 200,
      });
      return {
        ...mapProject(project),
        storyletGraphs: storyletGraphs.map((graph) => graph.id),
        activeGameStateId: extractActiveGameStateId(project),
      };
    },
  });
}

export async function fetchForgeGraphs(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number,
  kind?: ForgeGraphKind
): Promise<ForgeGraphDoc[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.graphs(projectId, kind),
    queryFn: async () => {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (kind) where.kind = { equals: kind };
      const graphs = await listDocs<PayloadGraph>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where,
        limit: 200,
      });
      return graphs.map(mapForgeGraph);
    },
  });
}

export async function fetchForgeGraph(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  graphId: number | string
): Promise<ForgeGraphDoc> {
  const id = typeof graphId === 'string' ? parseInt(graphId, 10) : graphId;
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.graph(id),
    queryFn: async () => {
      const graph = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id,
      })) as PayloadGraph;
      return mapForgeGraph(graph);
    },
  });
}

export async function fetchForgePages(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number,
  narrativeGraphId?: number | null
): Promise<ForgePage[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.pages(projectId, narrativeGraphId),
    queryFn: async () => {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (typeof narrativeGraphId === 'number') {
        where.narrativeGraph = { equals: narrativeGraphId };
      }
      const pages = await listDocs<PayloadPage>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.PAGES,
        where,
        limit: 1000,
      });
      return pages.map(mapForgePage).sort((a, b) => a.order - b.order);
    },
  });
}

export async function fetchForgeFlagSchema(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number
): Promise<ForgeFlagSchema | null> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.flagSchema(projectId),
    queryFn: async () => {
      const docs = await listDocs<PayloadFlagSchema>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        where: { project: { equals: projectId } },
        limit: 1,
      });
      if (!docs.length) return null;
      return mapFlagSchema(docs[0]);
    },
  });
}

export async function fetchForgeGameStates(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number
): Promise<ForgeGameStateRecord[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.gameStates(projectId),
    queryFn: async () => {
      const docs = await listDocs<PayloadGameState>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        where: { project: { equals: projectId } },
        limit: 200,
      });
      return docs.map(mapGameStateRecord);
    },
  });
}

export async function fetchForgeCharacters(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number
): Promise<ForgeCharacter[]> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.characters(projectId),
    queryFn: async () => {
      const docs = await listDocs<PayloadCharacter>(payload.find, {
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        where: { project: { equals: projectId } },
        limit: 200,
      });
      return docs.map(mapCharacter);
    },
  });
}

export async function fetchActiveForgeGameStateId(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number
): Promise<number | null> {
  return queryClient.fetchQuery({
    queryKey: forgeQueryKeys.activeGameStateId(projectId),
    queryFn: async () => {
      const project = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
      })) as PayloadProject;
      return extractActiveGameStateId(project);
    },
  });
}

export function useCreateForgeProject() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null }) => {
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        data: input as unknown as Record<string, unknown>,
      })) as PayloadProject;
      return mapProject(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.projects() });
    },
  });
}

export function useCreateForgeGraph() {
  const payload = useForgePayloadClient();
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
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        data: {
          project: input.projectId,
          kind: input.kind,
          title: input.title,
          flow: input.flow,
          startNodeId: input.startNodeId,
          endNodeIds: input.endNodeIds,
        },
      })) as PayloadGraph;
      return mapForgeGraph(created);
    },
    onSuccess: (graph) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.graphs(graph.project),
      });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graph(graph.id) });
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.project(graph.project),
      });
    },
  });
}

export function useUpdateForgeGraph() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      graphId,
      patch,
    }: {
      graphId: number;
      patch: Partial<
        Pick<
          ForgeGraphDoc,
          'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'
        >
      >;
    }) => {
      const updated = (await payload.update({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: graphId,
        data: patch as unknown as Record<string, unknown>,
      })) as PayloadGraph;
      return mapForgeGraph(updated);
    },
    onSuccess: (graph) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.graphs(graph.project),
      });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.graph(graph.id) });
    },
  });
}

export function useDeleteForgeGraph() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (graphId: number) => {
      const existing = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: graphId,
      })) as PayloadGraph;
      const project =
        typeof existing.project === 'number' ? existing.project : existing.project.id;
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: graphId,
      });
      return { graphId, projectId: project };
    },
    onSuccess: ({ graphId, projectId }) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.graph(graphId) });
      if (typeof projectId === 'number') {
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.graphs(projectId),
        });
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.project(projectId),
        });
      }
    },
  });
}

export function useCreateForgePage() {
  const payload = useForgePayloadClient();
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
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        data: {
          project: input.projectId,
          pageType: input.pageType,
          title: input.title,
          order: input.order,
          parent: input.parent ?? null,
          narrativeGraph: input.narrativeGraph ?? null,
          _status: 'draft',
        },
      })) as PayloadPage;
      return mapForgePage(created);
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.pages(page.project, page.narrativeGraph),
      });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.page(page.id) });
    },
  });
}

export function useUpdateForgePage() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      patch,
    }: {
      pageId: number;
      patch: Partial<ForgePage>;
    }) => {
      const updated = (await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: patch as unknown as Record<string, unknown>,
      })) as PayloadPage;
      return mapForgePage(updated);
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.pages(page.project, page.narrativeGraph),
      });
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.page(page.id) });
    },
  });
}

export function useDeleteForgePage() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: number) => {
      const existing = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      })) as PayloadPage;
      const project =
        typeof existing.project === 'number' ? existing.project : existing.project.id;
      const narrativeGraph =
        existing.narrativeGraph == null
          ? null
          : typeof existing.narrativeGraph === 'number'
            ? existing.narrativeGraph
            : existing.narrativeGraph.id ?? null;
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      });
      return { pageId, projectId: project, narrativeGraphId: narrativeGraph };
    },
    onSuccess: ({ pageId, projectId, narrativeGraphId }) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.page(pageId) });
      if (typeof projectId === 'number') {
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.pages(projectId, narrativeGraphId),
        });
      }
    },
  });
}

export function useCreateForgeGameState() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: number;
      name: string;
      state: ForgeGameState;
    }) => {
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        data: {
          project: input.projectId,
          type: 'AUTHORED',
          playerKey: input.name,
          state: input.state,
        },
      })) as PayloadGameState;
      return mapGameStateRecord(created);
    },
    onSuccess: (state) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.gameStates(state.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.project(state.projectId),
      });
    },
  });
}

export function useUpdateForgeGameState() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameStateId,
      patch,
    }: {
      gameStateId: number;
      patch: Partial<ForgeGameState>;
    }) => {
      const updated = (await payload.update({
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        id: gameStateId,
        data: { state: patch },
      })) as PayloadGameState;
      return mapGameStateRecord(updated);
    },
    onSuccess: (state) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.gameStates(state.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.gameState(state.id),
      });
    },
  });
}

export function useDeleteForgeGameState() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameStateId: number) => {
      const existing = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        id: gameStateId,
      })) as PayloadGameState;
      const projectId =
        typeof existing.project === 'number' ? existing.project : existing.project.id;
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        id: gameStateId,
      });
      return { gameStateId, projectId };
    },
    onSuccess: ({ gameStateId, projectId }) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.gameState(gameStateId) });
      if (typeof projectId === 'number') {
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.gameStates(projectId),
        });
      }
    },
  });
}

export function useSetActiveForgeGameState() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      gameStateId,
    }: {
      projectId: number;
      gameStateId: number;
    }) => {
      const project = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
      })) as PayloadProject;
      const settings = project.settings ?? {};
      await payload.update({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
        data: {
          settings: {
            ...settings,
            activeGameStateId: gameStateId,
          },
        },
      });
      return { projectId, gameStateId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.project(projectId) });
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.activeGameStateId(projectId),
      });
    },
  });
}

export function useCreateForgeCharacter() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: number;
      name: string;
      avatar?: number | null;
      meta?: unknown;
    }) => {
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        data: {
          project: input.projectId,
          name: input.name,
          avatar: input.avatar ?? null,
          meta: input.meta ?? undefined,
        },
      })) as PayloadCharacter;
      return mapCharacter(created);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.characters(variables.projectId),
      });
    },
  });
}

export function useUpdateForgeCharacter() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      characterId,
      patch,
    }: {
      characterId: number;
      patch: Partial<ForgeCharacter>;
    }) => {
      const updated = (await payload.update({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        id: characterId,
        data: patch as unknown as Record<string, unknown>,
      })) as PayloadCharacter;
      const projectId =
        updated.project == null
          ? undefined
          : typeof updated.project === 'number'
            ? updated.project
            : updated.project.id;
      return { character: mapCharacter(updated), projectId };
    },
    onSuccess: ({ character, projectId }) => {
      const id = Number(character.id);
      if (!Number.isNaN(id)) {
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.character(id) });
      }
      if (typeof projectId === 'number') {
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.characters(projectId),
        });
      }
    },
  });
}

export function useDeleteForgeCharacter() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (characterId: number) => {
      const existing = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        id: characterId,
      })) as PayloadCharacter;
      const projectId =
        existing.project == null
          ? undefined
          : typeof existing.project === 'number'
            ? existing.project
            : existing.project.id;
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        id: characterId,
      });
      return { characterId, projectId };
    },
    onSuccess: ({ characterId, projectId }) => {
      queryClient.removeQueries({ queryKey: forgeQueryKeys.character(characterId) });
      if (typeof projectId === 'number') {
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.characters(projectId),
        });
      }
    },
  });
}

export function useCreateForgeFlagSchema() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: number; schema: unknown }) => {
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        data: {
          project: input.projectId,
          schema: input.schema,
        },
      })) as PayloadFlagSchema;
      return mapFlagSchema(created);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: forgeQueryKeys.flagSchema(variables.projectId),
      });
    },
  });
}

export function useUpdateForgeFlagSchema() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      flagSchemaId,
      patch,
    }: {
      flagSchemaId: number;
      patch: Partial<ForgeFlagSchema>;
    }) => {
      const updated = (await payload.update({
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        id: flagSchemaId,
        data: patch as unknown as Record<string, unknown>,
      })) as PayloadFlagSchema;
      return mapFlagSchema(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forgeQueryKeys.all });
    },
  });
}

export function useDeleteForgeFlagSchema() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (flagSchemaId: number) => {
      const existing = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        id: flagSchemaId,
      })) as PayloadFlagSchema;
      const projectId =
        typeof existing.project === 'number'
          ? existing.project
          : existing.project.id;
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        id: flagSchemaId,
      });
      return { flagSchemaId, projectId };
    },
    onSuccess: ({ projectId }) => {
      if (typeof projectId === 'number') {
        queryClient.invalidateQueries({
          queryKey: forgeQueryKeys.flagSchema(projectId),
        });
      }
    },
  });
}
