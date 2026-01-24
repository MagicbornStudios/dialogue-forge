// src/forge/adapter/payload-forge-adapter.ts
import { PayloadSDK } from '@payloadcms/sdk';
import type { ForgeDataAdapter, ForgeProjectSummary, ForgeFlagSchema } from '@/forge/adapters/forge-data-adapter';
import type { ForgeGraphDoc, ForgeReactFlowJson, ForgeGraphKind } from '@/forge/types/forge-graph';
import type { Project, Character, FlagSchema, ForgeGraph, Act, GameState } from '@/app/payload-types';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';
import { ForgeAct } from '@/forge/types/narrative';
import { ForgeFlagState, ForgeGameState, ForgeGameStateRecord } from '@/forge/types/forge-game-state';
import type { ForgeCharacter } from '@/forge/types/characters';

/**
 * Helper to extract narrativeGraph ID from Project
 * narrativeGraph can be a number or a ForgeGraph object
 */
function extractNarrativeGraphId(project: Project): number | null {
  if (!project.narrativeGraph) return null;
  if (typeof project.narrativeGraph === 'number') {
    return project.narrativeGraph;
  }
  // It's a ForgeGraph object
  return project.narrativeGraph.id;
}

/**
 * Map Payload Character to ForgeCharacter
 * Converts id from number to string to match canonical type
 */
function mapCharacter(char: Character): ForgeCharacter {
  return {
    id: String(char.id), // Convert number ID to string
    name: char.name,
    avatar: typeof char.avatar === 'number' ? String(char.avatar) : (char.avatar?.id ? String(char.avatar.id) : undefined),
    meta: char.meta ?? undefined,
  };
}

/**
 * Map Payload ForgeGraph to ForgeGraphDoc
 */
function mapForgeGraph(graph: ForgeGraph): ForgeGraphDoc {
  // Handle project field - it can be a number, an object with id, or undefined/null
  let projectId: number;
  if (typeof graph.project === 'number') {
    projectId = graph.project;
  } else if (graph.project && typeof graph.project === 'object' && 'id' in graph.project) {
    projectId = graph.project.id;
  } else if (graph.project && typeof graph.project === 'object') {
    // Try to get id if project exists but structure is unexpected
    projectId = (graph.project as any)?.id;
    if (typeof projectId !== 'number') {
      throw new Error(`Cannot map ForgeGraph: project.id is not a number. Graph ID: ${graph.id}`);
    }
  } else {
    // If project is undefined/null, this is an error condition
    throw new Error(`Cannot map ForgeGraph: project field is missing or invalid. Graph ID: ${graph.id}`);
  }

  return {
    id: graph.id,
    project: projectId,
    kind: graph.kind,
    title: graph.title,
    startNodeId: graph.startNodeId,
    endNodeIds: graph.endNodeIds.map((end) => ({
      nodeId: end.nodeId,
      exitKey: end.exitKey ?? undefined,
    })),
    flow: graph.flow as ForgeReactFlowJson,
    compiledYarn: graph.compiledYarn ?? null,
    updatedAt: graph.updatedAt,
    createdAt: graph.createdAt,
  };
}

function extractProjectId(project: GameState['project']): number {
  if (typeof project === 'number') {
    return project;
  }
  if (project && typeof project === 'object' && 'id' in project) {
    return project.id;
  }
  throw new Error('Cannot map GameState: project field is missing or invalid.');
}

function normalizeGameState(state: unknown): ForgeGameState {
  if (!state || typeof state !== 'object') {
    return { flags: {} };
  }
  const stateData = state as { flags?: ForgeFlagState; characters?: unknown };
  return {
    flags: stateData.flags ?? {},
    characters: stateData.characters as Record<string, ForgeCharacter> | undefined,
  };
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

export function makePayloadForgeAdapter(opts?: {
  baseUrl?: string; // default: window.location.origin or 'http://localhost:3000'
}): ForgeDataAdapter {
  const baseURL = opts?.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  // PayloadSDK for REST API - baseURL points to the API endpoint
  const payload = new PayloadSDK({
    baseURL: `${baseURL}/api`,
  });

  return {
    async listProjects(): Promise<ForgeProjectSummary[]> {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        limit: 200,
      });
      return result.docs.map((p) => {
        const project = p as Project;
        return {
          id: project.id,
          name: project.name,
          slug: project.slug ?? null,
          narrativeGraph: extractNarrativeGraphId(project),
        };
      });
    },

    async getProject(projectId: number): Promise<ForgeProjectSummary> {
      const p = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
      }) as Project;
      const storyletGraphs = await payload.find({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where: {
          project: {
            equals: projectId,
          },
          kind: {
            equals: 'STORYLET',
          },
        },
        limit: 200,
      });
      const storyletGraphIds = storyletGraphs.docs.map((g) => g.id as number);
      const project: ForgeProjectSummary = {
        id: p.id,
        name: p.name,
        slug: p.slug ?? null,
        narrativeGraph: extractNarrativeGraphId(p),
        storyletGraphs: storyletGraphIds,
      };
      return project;

    },

    async listGraphs(projectId: number, kind?: ForgeGraphKind): Promise<ForgeGraphDoc[]> {
      const where: any = {
        project: {
          equals: projectId,
        },
      };
      if (kind) {
        where.kind = {
          equals: kind,
        };
      }

      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        where,
        limit: 200,
      });
      return result.docs.map((g) => mapForgeGraph(g as ForgeGraph));
    },

    async getGraph(graphId: number): Promise<ForgeGraphDoc> {
      const doc = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: graphId,
      }) as ForgeGraph;
      return mapForgeGraph(doc);
    },

    async createGraph(input: {
      projectId: number;
      kind: ForgeGraphKind;
      title: string;
      flow: ForgeReactFlowJson;
      startNodeId: string;
      endNodeIds: { nodeId: string; exitKey?: string }[];
    }): Promise<ForgeGraphDoc> {
      const doc = await payload.create({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        data: {
          project: input.projectId,
          kind: input.kind,
          title: input.title,
          flow: input.flow,
          startNodeId: input.startNodeId,
          endNodeIds: input.endNodeIds,
        },
      }) as ForgeGraph;
      
      // If the response doesn't have project populated, use the input projectId
      if (!doc.project) {
        doc.project = input.projectId;
      }
      
      return mapForgeGraph(doc);
    },

    async updateGraph(
      graphId: number,
      patch: Partial<Pick<ForgeGraphDoc, 'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>>
    ): Promise<ForgeGraphDoc> {
      const doc = await payload.update({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: graphId,
        data: patch,
      }) as ForgeGraph;
      return mapForgeGraph(doc);
    },

    async listCharacters(projectId: number): Promise<ForgeCharacter[]> {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        where: {
          project: {
            equals: projectId,
          },
        },
        limit: 200,
      });
      return result.docs.map((c) => mapCharacter(c as Character));
    },

    async getFlagSchema(projectId: number): Promise<ForgeFlagSchema | null> {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
        where: {
          project: {
            equals: projectId,
          },
        },
        limit: 1,
      });
      if (!result.docs.length) return null;
      const doc = result.docs[0] as FlagSchema;
      return {
        id: doc.id,
        schema: doc.schema,
      };
    },
    async getCharacter(characterId: number): Promise<ForgeCharacter> {
        const result = await payload.findByID({
            collection: PAYLOAD_COLLECTIONS.CHARACTERS,
            id: characterId,
        }) as Character;
        return mapCharacter(result);
    },
    async updateCharacter(characterId: number, patch: Partial<ForgeCharacter>): Promise<ForgeCharacter> {
        const result = await payload.update({
            collection: PAYLOAD_COLLECTIONS.CHARACTERS,
            id: characterId,
            data: patch,
        }) as Character;
        return mapCharacter(result);
    },
    async deleteCharacter(characterId: number): Promise<void> {
        await payload.delete({
            collection: PAYLOAD_COLLECTIONS.CHARACTERS,
            id: characterId,
        });
    },
    async createCharacter(input: {
        projectId: number;
        name: string;
        avatar?: number | null;
        meta?: unknown;
    }): Promise<ForgeCharacter> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.CHARACTERS,
            data: {
                project: input.projectId,
                name: input.name,
                avatar: input.avatar ?? null,
                meta: input.meta ?? undefined,
            },
        }) as Character;
        return mapCharacter(result);
    },
    async updateFlagSchema(flagSchemaId: number, patch: Partial<ForgeFlagSchema>): Promise<ForgeFlagSchema> {
        const result = await payload.update({
            collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
            id: flagSchemaId,
            data: patch,
        }) as FlagSchema;
        return {
            id: result.id,
            schema: result.schema,
        };
    },
    async createFlagSchema(input: {
        projectId: number;
        schema: unknown;
    }): Promise<ForgeFlagSchema> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
            data: {
                project: input.projectId,
                schema: input.schema,   
            },
        }) as FlagSchema;
        return {
            id: result.id,
            schema: result.schema,
        };
    },
    async deleteFlagSchema(flagSchemaId: number): Promise<void> {
        await payload.delete({
            collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
            id: flagSchemaId,
        });
    },
    async getAct(actId: number): Promise<ForgeAct> {
        const result = await payload.findByID({
            collection: PAYLOAD_COLLECTIONS.ACTS,
            id: actId,
        }) as Act;
        return {
            id: result.id,
            title: result.title,
            summary: result.summary ?? null,
            order: result.order,
            project: typeof result.project === 'number' ? result.project : result.project.id,
            bookHeading: result.bookHeading ?? null,
            bookBody: result.bookBody ?? null,
            _status: result._status as 'draft' | 'published' | null,
        };
    },
    // Unified page operations (for ACT, CHAPTER, PAGE nodes)
    async getPage(pageId: number): Promise<ForgePage> {
        const result = await payload.findByID({
            collection: PAYLOAD_COLLECTIONS.PAGES,
            id: pageId,
        }) as Page;
        
        const parentValue = result.parent;
        const parentId = parentValue === null || parentValue === undefined
          ? null
          : typeof parentValue === 'number'
          ? parentValue
          : parentValue.id;

        const dialogueGraphValue = result.dialogueGraph;
        const dialogueGraphId = dialogueGraphValue === null || dialogueGraphValue === undefined
          ? null
          : typeof dialogueGraphValue === 'number'
          ? dialogueGraphValue
          : dialogueGraphValue.id;

        return {
            id: result.id,
            pageType: result.pageType as 'ACT' | 'CHAPTER' | 'PAGE',
            title: result.title,
            summary: result.summary ?? null,
            order: result.order,
            project: typeof result.project === 'number' ? result.project : result.project.id,
            parent: parentId,
            dialogueGraph: dialogueGraphId,
            bookHeading: result.bookHeading ?? null,
            bookBody: result.bookBody ?? null,
            content: result.content ?? null,
            archivedAt: result.archivedAt ?? null,
            _status: result._status as 'draft' | 'published' | null,
        };
    },
    
    async createPage(input: {
        projectId: number;
        pageType: 'ACT' | 'CHAPTER' | 'PAGE';
        title: string;
        order: number;
        parent?: number | null;
    }): Promise<ForgePage> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.PAGES,
            data: {
                project: input.projectId,
                pageType: input.pageType,
                title: input.title,
                order: input.order,
                parent: input.parent ?? null,
                _status: 'draft',
            },
        }) as Page;
        
        const parentValue = result.parent;
        const parentId = parentValue === null || parentValue === undefined
          ? null
          : typeof parentValue === 'number'
          ? parentValue
          : parentValue.id;

        const dialogueGraphValue = result.dialogueGraph;
        const dialogueGraphId = dialogueGraphValue === null || dialogueGraphValue === undefined
          ? null
          : typeof dialogueGraphValue === 'number'
          ? dialogueGraphValue
          : dialogueGraphValue.id;

        return {
            id: result.id,
            pageType: result.pageType as 'ACT' | 'CHAPTER' | 'PAGE',
            title: result.title,
            summary: result.summary ?? null,
            order: result.order,
            project: typeof result.project === 'number' ? result.project : result.project.id,
            parent: parentId,
            dialogueGraph: dialogueGraphId,
            bookHeading: result.bookHeading ?? null,
            bookBody: result.bookBody ?? null,
            content: result.content ?? null,
            archivedAt: result.archivedAt ?? null,
            _status: result._status as 'draft' | 'published' | null,
        };
    },
    
    async updatePage(pageId: number, patch: Partial<ForgePage>): Promise<ForgePage> {
        const result = await payload.update({
            collection: PAYLOAD_COLLECTIONS.PAGES,
            id: pageId,
            data: patch,
        }) as Page;
        
        const parentValue = result.parent;
        const parentId = parentValue === null || parentValue === undefined
          ? null
          : typeof parentValue === 'number'
          ? parentValue
          : parentValue.id;

        const dialogueGraphValue = result.dialogueGraph;
        const dialogueGraphId = dialogueGraphValue === null || dialogueGraphValue === undefined
          ? null
          : typeof dialogueGraphValue === 'number'
          ? dialogueGraphValue
          : dialogueGraphValue.id;

        return {
            id: result.id,
            pageType: result.pageType as 'ACT' | 'CHAPTER' | 'PAGE',
            title: result.title,
            summary: result.summary ?? null,
            order: result.order,
            project: typeof result.project === 'number' ? result.project : result.project.id,
            parent: parentId,
            dialogueGraph: dialogueGraphId,
            bookHeading: result.bookHeading ?? null,
            bookBody: result.bookBody ?? null,
            content: result.content ?? null,
            archivedAt: result.archivedAt ?? null,
            _status: result._status as 'draft' | 'published' | null,
        };
    },
    
    async deletePage(pageId: number): Promise<void> {
        await payload.delete({
            collection: PAYLOAD_COLLECTIONS.PAGES,
            id: pageId,
        });
    },
    
    // Game state operations
    async listGameStates(projectId: number): Promise<ForgeGameStateRecord[]> {
        const result = await payload.find({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            where: {
                project: {
                    equals: projectId,
                },
            },
            limit: 200,
        });
        return result.docs.map((doc) => mapGameStateRecord(doc as GameState));
    },
    async getGameState(gameStateId: number): Promise<ForgeGameStateRecord> {
        const result = await payload.findByID({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            id: gameStateId,
        }) as GameState;
        return mapGameStateRecord(result);
    },
    async getActiveGameStateId(projectId: number): Promise<number | null> {
        const project = await payload.findByID({
            collection: PAYLOAD_COLLECTIONS.PROJECTS,
            id: projectId,
        }) as Project;
        const settings = project.settings as { activeGameStateId?: number | null } | null | undefined;
        const activeId = settings?.activeGameStateId;
        return typeof activeId === 'number' ? activeId : null;
    },
    async setActiveGameState(projectId: number, gameStateId: number): Promise<void> {
        const project = await payload.findByID({
            collection: PAYLOAD_COLLECTIONS.PROJECTS,
            id: projectId,
        }) as Project;
        const settings = (project.settings as Record<string, unknown> | null | undefined) ?? {};
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
    },
    async updateGameState(gameStateId: number, patch: Partial<ForgeGameState>): Promise<ForgeGameStateRecord> {
        const result = await payload.update({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            id: gameStateId,
            data: {
                state: patch,
            },
        }) as GameState;
        return mapGameStateRecord(result);
    },
    async createGameState(input: {
        projectId: number;
        name: string;
        state: ForgeGameState;
    }): Promise<ForgeGameStateRecord> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            data: {
                project: input.projectId,
                type: 'AUTHORED',
                playerKey: input.name,
                state: input.state,
            },
        }) as GameState;
        return mapGameStateRecord(result);
    },
    async deleteGameState(gameStateId: number): Promise<void> {
        await payload.delete({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            id: gameStateId,
        });
    },
    async createProject(input: {
        name: string;
        slug: string;
        narrativeGraph: number;
    }): Promise<ForgeProjectSummary> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.PROJECTS,
            data: input,
        }) as Project;
        return {
            id: result.id,
            name: result.name,
            slug: result.slug ?? null,
            narrativeGraph: extractNarrativeGraphId(result),
        };
    },
  };

}
