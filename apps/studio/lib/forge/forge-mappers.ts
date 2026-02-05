'use client';

import type { ForgeProjectSummary, ForgeFlagSchema } from '@magicborn/forge/adapters/forge-data-adapter';
import type { ForgeGraphDoc, ForgeReactFlowJson, ForgeGraphKind } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState, ForgeGameStateRecord } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { ForgePage, PageType } from '@magicborn/shared/types/narrative';
import type { Project, Character, FlagSchema, ForgeGraph, GameState, Page } from '@magicborn/types';

export function extractNarrativeGraphId(project: Project): number | null {
  if (!project.narrativeGraph) return null;
  if (typeof project.narrativeGraph === 'number') return project.narrativeGraph;
  return project.narrativeGraph.id;
}

export function mapCharacter(char: Character): ForgeCharacter {
  return {
    id: String(char.id),
    name: char.name,
    avatar: typeof char.avatar === 'number' ? String(char.avatar) : (char.avatar?.id ? String(char.avatar.id) : undefined),
    meta: char.meta ?? undefined,
  };
}

export function mapForgeGraph(graph: ForgeGraph): ForgeGraphDoc {
  let projectId: number;
  if (typeof graph.project === 'number') projectId = graph.project;
  else if (graph.project && typeof graph.project === 'object' && 'id' in graph.project) projectId = graph.project.id;
  else if (graph.project && typeof graph.project === 'object') {
    projectId = (graph.project as { id?: number })?.id as number;
    if (typeof projectId !== 'number') throw new Error(`Cannot map ForgeGraph: project.id is not a number. Graph ID: ${graph.id}`);
  } else throw new Error(`Cannot mapForgeGraph: project field is missing or invalid. Graph ID: ${graph.id}`);

  return {
    id: graph.id,
    project: projectId,
    kind: graph.kind as ForgeGraphDoc['kind'],
    title: graph.title,
    startNodeId: graph.startNodeId,
    endNodeIds: graph.endNodeIds.map((end) => ({ nodeId: end.nodeId, exitKey: end.exitKey ?? undefined })),
    flow: graph.flow as ForgeReactFlowJson,
    compiledYarn: graph.compiledYarn ?? null,
    updatedAt: graph.updatedAt,
    createdAt: graph.createdAt,
  };
}

function extractProjectIdFromGameState(project: GameState['project']): number {
  if (typeof project === 'number') return project;
  if (project && typeof project === 'object' && 'id' in project) return project.id;
  throw new Error('Cannot map GameState: project field is missing or invalid.');
}

export function normalizeGameState(state: unknown): ForgeGameState {
  if (!state || typeof state !== 'object') return { flags: {} };
  const d = state as { flags?: ForgeGameState['flags']; characters?: unknown };
  return { flags: d.flags ?? {}, characters: d.characters as Record<string, ForgeCharacter> | undefined };
}

export function mapGameStateRecord(gameState: GameState): ForgeGameStateRecord {
  return {
    id: gameState.id,
    projectId: extractProjectIdFromGameState(gameState.project),
    name: gameState.playerKey ?? `Game State ${gameState.id}`,
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt,
    state: normalizeGameState(gameState.state),
  };
}

export function mapProject(project: Project): ForgeProjectSummary {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug ?? null,
    narrativeGraph: extractNarrativeGraphId(project),
  };
}

export function mapForgePage(doc: Page & { narrativeGraph?: number | { id: number } | null }): ForgePage {
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

export function mapFlagSchema(doc: FlagSchema): ForgeFlagSchema {
  return { id: doc.id, schema: doc.schema };
}
