// src/forge/adapter/payload-forge-adapter.ts
import { PayloadSDK } from '@payloadcms/sdk';
import type { ForgeDataAdapter, ForgeProjectSummary, ForgeFlagSchema } from '@/src/components/forge/forge-data-adapter/forge-data-adapter';
import type { ForgeGraphDoc, ForgeReactFlowJson, ForgeGraphKind } from '@/src/types/forge/forge-graph';
import type { Project, Character, FlagSchema, ForgeGraph, Act, GameState } from '@/app/payload-types';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';
import { ForgeAct } from '@/src/types/narrative';
import { ForgeFlagState, ForgeGameState } from '@/src/types/forge-game-state';
import type { ForgeCharacter } from '@/src/types/characters';

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
  return {
    id: graph.id,
    project: typeof graph.project === 'number' ? graph.project : graph.project.id,
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
    async updateAct(actId: number, patch: Partial<ForgeAct>): Promise<ForgeAct> {
        const result = await payload.update({
            collection: PAYLOAD_COLLECTIONS.ACTS,
            id: actId,
            data: patch,
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
    async deleteAct(actId: number): Promise<void> {
        await payload.delete({
            collection: PAYLOAD_COLLECTIONS.ACTS,
            id: actId,
        });
    },
    async createAct(input: {
        projectId: number;
        name: string;
        summary?: string | null;
        order: number;
    }): Promise<ForgeAct> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.ACTS,
            data: {
                project: input.projectId,
                name: input.name,
                summary: input.summary ?? null,
                order: input.order,
            },
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
    async getGameState(projectId: number): Promise<ForgeGameState> {
        try {
            const result = await payload.findByID({
                collection: PAYLOAD_COLLECTIONS.GAME_STATES,
                id: projectId,
            }) as GameState;

            let charactersResult = await payload.find({
                collection: PAYLOAD_COLLECTIONS.CHARACTERS,
                where: {
                    project: {
                        equals: projectId,
                    },
                },
            });
            let characters = charactersResult.docs.map((c) => mapCharacter(c as Character))
            const forgeCharacters = characters.map((c) => c as ForgeCharacter);
            const forgeCharactersMapRecord = forgeCharacters.reduce((acc, c) => {
                acc[c.id] = c; // c.id is already a string
                return acc;
            }, {} as Record<string, ForgeCharacter>);
            const stateData = result.state as { flags?: ForgeFlagState; characters?: unknown } | undefined;
            const forgeFlags = stateData?.flags as ForgeFlagState | undefined;

            return {
                flags: forgeFlags || {},
                characters: forgeCharactersMapRecord,
            } as ForgeGameState;
        } catch (error: any) {
            // Handle 404 or other errors gracefully
            if (error?.status === 404 || error?.message?.includes('not found') || error?.message?.includes('Error retrieving the document')) {
                // Return default empty game state
                return { flags: {} };
            }
            // Re-throw unexpected errors
            throw error;
        }
    },
    async updateGameState(projectId: number, patch: Partial<ForgeGameState>): Promise<ForgeGameState> {
        const result = await payload.update({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            id: projectId,
            data: {
                state: patch,
            },
        }) as GameState;
        const stateData = (result.state as unknown) as ForgeGameState | undefined;
        return stateData || { flags: {} };
    },
    async createGameState(input: {
        projectId: number;
        state: unknown;
    }): Promise<ForgeGameState> {
        const result = await payload.create({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            data: {
                project: input.projectId,
                type: 'AUTHORED',
                state: input.state,
            },
        }) as GameState;
        const stateData = (result.state as unknown) as ForgeGameState | undefined;
        return stateData || { flags: {} };
    },
    async deleteGameState(projectId: number): Promise<void> {
        await payload.delete({
            collection: PAYLOAD_COLLECTIONS.GAME_STATES,
            id: projectId,
        });
    },
  };

}
