'use client';

import { useMemo } from 'react';
import type { ForgeDataAdapter, ForgeProjectSummary, ForgeFlagSchema } from '@magicborn/forge/adapters/forge-data-adapter';
import type { ForgeGraphDoc, ForgeReactFlowJson, ForgeGraphKind } from '@magicborn/forge/types/forge-graph';
import type { Project, Character, FlagSchema, ForgeGraph, GameState, Page } from '../../payload-types';
import { PAYLOAD_COLLECTIONS } from '../../payload-collections/enums';
import { ForgeFlagState, ForgeGameState, ForgeGameStateRecord } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import { type PageType } from '@magicborn/forge/types/narrative';
import { payload } from './payload';

function extractNarrativeGraphId(project: Project): number | null {
  if (!project.narrativeGraph) return null;
  if (typeof project.narrativeGraph === 'number') return project.narrativeGraph;
  return project.narrativeGraph.id;
}

function mapCharacter(char: Character): ForgeCharacter {
  return {
    id: String(char.id),
    name: char.name,
    avatar: typeof char.avatar === 'number' ? String(char.avatar) : (char.avatar?.id ? String(char.avatar.id) : undefined),
    meta: char.meta ?? undefined,
  };
}

function mapForgeGraph(graph: ForgeGraph): ForgeGraphDoc {
  let projectId: number;
  if (typeof graph.project === 'number') projectId = graph.project;
  else if (graph.project && typeof graph.project === 'object' && 'id' in graph.project) projectId = graph.project.id;
  else if (graph.project && typeof graph.project === 'object') {
    projectId = (graph.project as { id?: number })?.id as number;
    if (typeof projectId !== 'number') throw new Error(`Cannot map ForgeGraph: project.id is not a number. Graph ID: ${graph.id}`);
  } else throw new Error(`Cannot map ForgeGraph: project field is missing or invalid. Graph ID: ${graph.id}`);

  return {
    id: graph.id,
    project: projectId,
    kind: graph.kind,
    title: graph.title,
    startNodeId: graph.startNodeId,
    endNodeIds: graph.endNodeIds.map((end) => ({ nodeId: end.nodeId, exitKey: end.exitKey ?? undefined })),
    flow: graph.flow as ForgeReactFlowJson,
    compiledYarn: graph.compiledYarn ?? null,
    updatedAt: graph.updatedAt,
    createdAt: graph.createdAt,
  };
}

function extractProjectId(project: GameState['project']): number {
  if (typeof project === 'number') return project;
  if (project && typeof project === 'object' && 'id' in project) return project.id;
  throw new Error('Cannot map GameState: project field is missing or invalid.');
}

function normalizeGameState(state: unknown): ForgeGameState {
  if (!state || typeof state !== 'object') return { flags: {} };
  const d = state as { flags?: ForgeFlagState; characters?: unknown };
  return { flags: d.flags ?? {}, characters: d.characters as Record<string, ForgeCharacter> | undefined };
}

function mapGameStateRecord(gameState: GameState): ForgeGameStateRecord {
  return {
    id: gameState.id,
    projectId: extractProjectId(gameState.project),
    name: gameState.playerKey ?? `Game State ${gameState.id}`,
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt,
    state: normalizeGameState(gameState.state),
  };
}

function mapProject(project: Project): ForgeProjectSummary {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug ?? null,
    narrativeGraph: extractNarrativeGraphId(project),
  };
}

function mapPage(doc: Page & { narrativeGraph?: number | { id: number } | null }) {
  const parentId = doc.parent === null || doc.parent === undefined ? null : typeof doc.parent === 'number' ? doc.parent : doc.parent.id;
  const dialogueGraphId = doc.dialogueGraph == null ? null : typeof doc.dialogueGraph === 'number' ? doc.dialogueGraph : doc.dialogueGraph.id;
  const narrativeGraphId = doc.narrativeGraph == null ? null : typeof doc.narrativeGraph === 'number' ? doc.narrativeGraph : doc.narrativeGraph.id;
  return {
    id: doc.id,
    pageType: doc.pageType as PageType,
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: typeof doc.project === 'number' ? doc.project : doc.project.id,
    parent: parentId,
    narrativeGraph: narrativeGraphId,
    dialogueGraph: dialogueGraphId,
    bookHeading: doc.bookHeading ?? null,
    bookBody: doc.bookBody ?? null,
    content: doc.content ?? null,
    archivedAt: doc.archivedAt ?? null,
  };
}

export function useForgeData(): ForgeDataAdapter {
  return useMemo((): ForgeDataAdapter => ({
    async listProjects() {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PROJECTS, limit: 200 });
      return result.docs.map((p) => mapProject(p as Project));
    },
    async getProject(projectId: number) {
      const p = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId })) as Project;
      const storyletGraphs = await payload.find({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where: { project: { equals: projectId }, kind: { equals: 'STORYLET' } },
        limit: 200,
      });
      const storyletGraphIds = storyletGraphs.docs.map((g) => g.id as number);
      return { id: p.id, name: p.name, slug: p.slug ?? null, narrativeGraph: extractNarrativeGraphId(p), storyletGraphs: storyletGraphIds };
    },
    async listGraphs(projectId: number, kind?: ForgeGraphKind) {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (kind) (where as any).kind = { equals: kind };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, where: where as any, limit: 200 });
      return result.docs.map((g) => mapForgeGraph(g as ForgeGraph));
    },
    async getGraph(graphId: number) {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: graphId })) as ForgeGraph;
      return mapForgeGraph(doc);
    },
    async listPages(projectId: number, narrativeGraphId?: number | null) {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (typeof narrativeGraphId === 'number') (where as any).narrativeGraph = { equals: narrativeGraphId };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PAGES, where: where as any, limit: 1000 });
      return result.docs.map((doc) => mapPage(doc as Page));
    },
    async createGraph(input: {
      projectId: number;
      kind: ForgeGraphKind;
      title: string;
      flow: ForgeReactFlowJson;
      startNodeId: string;
      endNodeIds: { nodeId: string; exitKey?: string }[];
    }) {
      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        data: { project: input.projectId, kind: input.kind, title: input.title, flow: input.flow, startNodeId: input.startNodeId, endNodeIds: input.endNodeIds },
      })) as ForgeGraph;
      if (!doc.project) (doc as any).project = input.projectId;
      return mapForgeGraph(doc);
    },
    async updateGraph(graphId: number, patch: Partial<Pick<ForgeGraphDoc, 'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>>) {
      const doc = (await payload.update({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: graphId, data: patch })) as ForgeGraph;
      return mapForgeGraph(doc);
    },
    async deleteGraph(graphId: number) {
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS, id: graphId });
    },
    async listCharacters(projectId: number) {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, where: { project: { equals: projectId } }, limit: 200 });
      return result.docs.map((c) => mapCharacter(c as Character));
    },
    async getFlagSchema(projectId: number) {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, where: { project: { equals: projectId } }, limit: 1 });
      if (!result.docs.length) return null;
      const doc = result.docs[0] as FlagSchema;
      return { id: doc.id, schema: doc.schema };
    },
    async getCharacter(characterId: number) {
      return mapCharacter((await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId })) as Character);
    },
    async updateCharacter(characterId: number, patch: Partial<ForgeCharacter>) {
      return mapCharacter((await payload.update({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId, data: patch as any })) as unknown as Character);
    },
    async deleteCharacter(characterId: number) {
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterId });
    },
    async createCharacter(input: { projectId: number; name: string; avatar?: number | null; meta?: unknown }) {
      return mapCharacter((await payload.create({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        data: { project: input.projectId, name: input.name, avatar: input.avatar ?? null, meta: input.meta ?? undefined } as any,
      })) as Character);
    },
    async updateFlagSchema(flagSchemaId: number, patch: Partial<ForgeFlagSchema>) {
      const result = (await payload.update({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, id: flagSchemaId, data: patch as any })) as unknown as FlagSchema;
      return { id: result.id, schema: result.schema };
    },
    async createFlagSchema(input: { projectId: number; schema: unknown }) {
      const result = (await payload.create({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, data: { project: input.projectId, schema: input.schema } as any })) as unknown as FlagSchema;
      return { id: result.id, schema: result.schema };
    },
    async deleteFlagSchema(flagSchemaId: number) {
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, id: flagSchemaId });
    },
    async getPage(pageId: number) {
      return mapPage((await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page);
    },
    async createPage(input: { projectId: number; pageType: PageType; title: string; order: number; parent?: number | null; narrativeGraph?: number | null }) {
      return mapPage((await payload.create({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        data: { project: input.projectId, pageType: input.pageType, title: input.title, order: input.order, parent: input.parent ?? null, narrativeGraph: input.narrativeGraph ?? null, _status: 'draft' } as any,
      })) as unknown as Page);
    },
    async updatePage(pageId: number, patch: Partial<ForgePage>) {
      return mapPage((await payload.update({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId, data: patch as any })) as unknown as Page);
    },
    async deletePage(pageId: number) {
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId });
    },
    async listGameStates(projectId: number) {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, where: { project: { equals: projectId } }, limit: 200 });
      return result.docs.map((doc) => mapGameStateRecord(doc as GameState));
    },
    async getGameState(gameStateId: number) {
      return mapGameStateRecord((await payload.findByID({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId })) as GameState);
    },
    async getActiveGameStateId(projectId: number) {
      const project = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId })) as Project;
      const settings = project.settings as { activeGameStateId?: number | null } | null | undefined;
      const activeId = settings?.activeGameStateId;
      return typeof activeId === 'number' ? activeId : null;
    },
    async setActiveGameState(projectId: number, gameStateId: number) {
      const project = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId })) as Project;
      const settings = (project.settings as Record<string, unknown> | null | undefined) ?? {};
      await payload.update({ collection: PAYLOAD_COLLECTIONS.PROJECTS, id: projectId, data: { settings: { ...settings, activeGameStateId: gameStateId } } });
    },
    async updateGameState(gameStateId: number, patch: Partial<ForgeGameState>) {
      return mapGameStateRecord((await payload.update({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId, data: { state: patch } })) as GameState);
    },
    async createGameState(input: { projectId: number; name: string; state: ForgeGameState }) {
      return mapGameStateRecord((await payload.create({
        collection: PAYLOAD_COLLECTIONS.GAME_STATES,
        data: { project: input.projectId, type: 'AUTHORED', playerKey: input.name, state: input.state } as any,
      })) as unknown as GameState);
    },
    async deleteGameState(gameStateId: number) {
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.GAME_STATES, id: gameStateId });
    },
    async createProject(input: { name: string; description?: string | null }) {
      const result = (await payload.create({ collection: PAYLOAD_COLLECTIONS.PROJECTS, data: input })) as Project;
      return mapProject(result);
    },
  }), []);
}
