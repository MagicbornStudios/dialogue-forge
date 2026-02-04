// src/forge/adapter/forge-data-adapter.ts
import type { ForgeGraphDoc, ForgeReactFlowJson, ForgeGraphKind } from '@magicborn/forge/types/forge-graph';
import { ForgeGameState, ForgeGameStateRecord } from '@magicborn/shared/types/forge-game-state';
import type { ForgePage, PageType } from '@magicborn/forge/types/narrative';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';

export type ForgeProjectSummary = {
  id: number;
  name: string;
  slug?: string | null;
  narrativeGraph?: number | null;
  storyletGraphs?: number[] | null;
};


export type ForgeFlagSchema = {
  id: number;
  schema: unknown;
};

export interface ForgeDataAdapter {
  // Projects
  listProjects(): Promise<ForgeProjectSummary[]>;
  getProject(projectId: number): Promise<ForgeProjectSummary>;
  createProject(input: {
    name: string;
    description?: string | null;
  }): Promise<ForgeProjectSummary>;

  // Graphs
  listGraphs(projectId: number, kind?: ForgeGraphKind): Promise<ForgeGraphDoc[]>;
  getGraph(graphId: number): Promise<ForgeGraphDoc>;
  listPages(projectId: number, narrativeGraphId?: number | null): Promise<ForgePage[]>;
  createGraph(input: {
    projectId: number;
    kind: ForgeGraphKind;
    title: string;
    flow: ForgeReactFlowJson;
    startNodeId: string;
    endNodeIds: { nodeId: string; exitKey?: string }[];
  }): Promise<ForgeGraphDoc>;
  updateGraph(graphId: number, patch: Partial<Pick<ForgeGraphDoc, 'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>>): Promise<ForgeGraphDoc>;
  deleteGraph(graphId: number): Promise<void>;

  // Supporting authored data
  listCharacters(projectId: number): Promise<ForgeCharacter[]>;
  getFlagSchema(projectId: number): Promise<ForgeFlagSchema | null>;
  getCharacter(characterId: number): Promise<ForgeCharacter>;
  updateCharacter(characterId: number, patch: Partial<ForgeCharacter>): Promise<ForgeCharacter>;
  deleteCharacter(characterId: number): Promise<void>;
  createCharacter(input: {
    projectId: number;
    name: string;
    avatar?: number | null;
    meta?: unknown;
  }): Promise<ForgeCharacter>;
  updateFlagSchema(flagSchemaId: number, patch: Partial<ForgeFlagSchema>): Promise<ForgeFlagSchema>;
  createFlagSchema(input: { 
    projectId: number;
    schema: unknown;
  }): Promise<ForgeFlagSchema>;
  deleteFlagSchema(flagSchemaId: number): Promise<void>;
  
  // Unified page operations (for ACT, CHAPTER, PAGE nodes)
  getPage(pageId: number): Promise<ForgePage>;
  createPage(input: {
    projectId: number;
    pageType: PageType;
    title: string;
    order: number;
    parent?: number | null;
    narrativeGraph?: number | null;
  }): Promise<ForgePage>;
  updatePage(pageId: number, patch: Partial<ForgePage>): Promise<ForgePage>;
  deletePage(pageId: number): Promise<void>;
  
  // Game state operations
  listGameStates(projectId: number): Promise<ForgeGameStateRecord[]>;
  getGameState(gameStateId: number): Promise<ForgeGameStateRecord>;
  getActiveGameStateId(projectId: number): Promise<number | null>;
  setActiveGameState(projectId: number, gameStateId: number): Promise<void>;
  updateGameState(gameStateId: number, patch: Partial<ForgeGameState>): Promise<ForgeGameStateRecord>;
  createGameState(input: {
    projectId: number;
    name: string;
    state: ForgeGameState;
  }): Promise<ForgeGameStateRecord>;
  deleteGameState(gameStateId: number): Promise<void>;
}
