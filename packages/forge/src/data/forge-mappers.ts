import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { ForgeFlagSchema, ForgeProjectSummary } from './forge-types';
import type {
  ForgeGraphDoc,
  ForgeGraphKind,
  ForgeReactFlowJson,
} from '@magicborn/forge/types/forge-graph';
import type {
  ForgeGameState,
  ForgeGameStateRecord,
} from '@magicborn/shared/types/forge-game-state';
import type { ForgePage, PageType } from '@magicborn/shared/types/narrative';

type MaybeIdRef = number | { id?: number } | null | undefined;

function extractId(value: MaybeIdRef, field: string): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id;
  }
  throw new Error(`Expected numeric id for ${field}`);
}

export function extractNarrativeGraphId(project: {
  narrativeGraph?: MaybeIdRef;
}): number | null {
  const value = project.narrativeGraph;
  if (value == null) return null;
  if (typeof value === 'number') return value;
  return typeof value.id === 'number' ? value.id : null;
}

export function extractActiveGameStateId(project: {
  settings?: Record<string, unknown> | null;
}): number | null {
  const settings = project.settings ?? {};
  const active = settings.activeGameStateId;
  return typeof active === 'number' ? active : null;
}

export function mapCharacter(char: {
  id: number | string;
  name?: string;
  avatar?: MaybeIdRef | string;
  meta?: unknown;
}): ForgeCharacter {
  const avatarValue = char.avatar;
  let avatar: string | undefined;
  if (typeof avatarValue === 'number') avatar = String(avatarValue);
  else if (typeof avatarValue === 'string') avatar = avatarValue;
  else if (
    avatarValue &&
    typeof avatarValue === 'object' &&
    typeof avatarValue.id === 'number'
  ) {
    avatar = String(avatarValue.id);
  }

  return {
    id: String(char.id),
    name: char.name ?? 'Unnamed Character',
    avatar,
    meta: char.meta ?? undefined,
  };
}

export function normalizeGameState(state: unknown): ForgeGameState {
  if (!state || typeof state !== 'object') return { flags: {} };
  const data = state as {
    flags?: ForgeGameState['flags'];
    characters?: ForgeGameState['characters'];
  };
  return {
    flags: data.flags ?? {},
    characters: data.characters,
  };
}

export function mapGameStateRecord(gameState: {
  id: number;
  project: MaybeIdRef;
  playerKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  state?: unknown;
}): ForgeGameStateRecord {
  return {
    id: gameState.id,
    projectId: extractId(gameState.project, 'gameState.project'),
    name: gameState.playerKey ?? `Game State ${gameState.id}`,
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt,
    state: normalizeGameState(gameState.state),
  };
}

export function mapProject(project: {
  id: number;
  name: string;
  slug?: string | null;
  narrativeGraph?: MaybeIdRef;
  settings?: Record<string, unknown> | null;
}): ForgeProjectSummary {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug ?? null,
    narrativeGraph: extractNarrativeGraphId(project),
    activeGameStateId: extractActiveGameStateId(project),
  };
}

export function mapForgeGraph(graph: {
  id: number;
  project: MaybeIdRef;
  kind: string;
  title: string;
  startNodeId: string;
  endNodeIds: Array<{ nodeId: string; exitKey?: string | null }>;
  flow: unknown;
  compiledYarn?: string | null;
  createdAt?: string;
  updatedAt?: string;
}): ForgeGraphDoc {
  return {
    id: graph.id,
    project: extractId(graph.project, 'graph.project'),
    kind: graph.kind as ForgeGraphKind,
    title: graph.title,
    startNodeId: graph.startNodeId,
    endNodeIds: (graph.endNodeIds ?? []).map((end) => ({
      nodeId: end.nodeId,
      exitKey: end.exitKey ?? undefined,
    })),
    flow: graph.flow as ForgeReactFlowJson,
    compiledYarn: graph.compiledYarn ?? null,
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
  };
}

export function mapForgePage(doc: {
  id: number;
  pageType: string;
  title: string;
  summary?: string | null;
  order: number;
  project: MaybeIdRef;
  parent?: MaybeIdRef;
  narrativeGraph?: MaybeIdRef;
  dialogueGraph?: MaybeIdRef;
  bookHeading?: string | null;
  bookBody?: string | null | Record<string, unknown>;
  content?: unknown;
  archivedAt?: string | null;
}): ForgePage {
  const narrativeGraph =
    doc.narrativeGraph == null ? null : extractId(doc.narrativeGraph, 'page.narrativeGraph');
  const dialogueGraph =
    doc.dialogueGraph == null ? null : extractId(doc.dialogueGraph, 'page.dialogueGraph');
  const parent = doc.parent == null ? null : extractId(doc.parent, 'page.parent');

  return {
    id: doc.id,
    pageType: doc.pageType as PageType,
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: extractId(doc.project, 'page.project'),
    parent,
    narrativeGraph,
    dialogueGraph,
    bookHeading: doc.bookHeading ?? null,
    bookBody:
      typeof doc.bookBody === 'string'
        ? doc.bookBody
        : doc.bookBody == null
          ? null
          : JSON.stringify(doc.bookBody),
    content: doc.content ?? null,
    archivedAt: doc.archivedAt ?? null,
  };
}

export function mapFlagSchema(doc: {
  id: number;
  schema: unknown;
}): ForgeFlagSchema {
  return { id: doc.id, schema: doc.schema };
}
