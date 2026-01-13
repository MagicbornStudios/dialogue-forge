// src/forge/adapter/forge-data-adapter.ts
import type { ForgeGraphDoc, ForgeFlowJson, ForgeGraphKind } from '@/src/types/forge/forge-graph';
import { ForgeAct } from '@/src/types/narrative';

export type ForgeProjectSummary = {
  id: number;
  name: string;
  slug?: string | null;
  narrativeGraph?: number | null;
  storyletGraphs?: number[] | null;
};

export type ForgeCharacter = {
  id: number;
  name: string;
  avatar?: number | null;
  meta?: unknown;
};

export type ForgeFlagSchema = {
  id: number;
  schema: unknown;
};

export interface ForgeDataAdapter {
  // Projects
  listProjects(): Promise<ForgeProjectSummary[]>;
  getProject(projectId: number): Promise<ForgeProjectSummary>;

  // Graphs
  listGraphs(projectId: number, kind?: ForgeGraphKind): Promise<ForgeGraphDoc[]>;
  getGraph(graphId: number): Promise<ForgeGraphDoc>;
  createGraph(input: {
    projectId: number;
    kind: ForgeGraphKind;
    title: string;
    flow: ForgeFlowJson;
    startNodeId: string;
    endNodeIds: { nodeId: string; exitKey?: string }[];
  }): Promise<ForgeGraphDoc>;
  updateGraph(graphId: number, patch: Partial<Pick<ForgeGraphDoc, 'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>>): Promise<ForgeGraphDoc>;

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
  getAct(actId: number): Promise<ForgeAct>;
  updateAct(actId: number, patch: Partial<ForgeAct>): Promise<ForgeAct>;
  deleteAct(actId: number): Promise<void>;
  createAct(input: {
    projectId: number;
    name: string;
    summary?: string | null;
    order: number;
  }): Promise<ForgeAct>;
}
