/**
 * Forge Workspace Actions
 * 
 * Workspace-level CopilotKit actions that operate on the Forge workspace store.
 * These actions manage domain state (graphs, flag schema, game state).
 */

import type { StoreApi } from 'zustand/vanilla';
import type { ForgeWorkspaceState } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';
import { FORGE_ACTION_NAME } from '../../constants/forge-action-names';
import { GRAPH_SCOPE } from '@/forge/types/constants';

/**
 * Create getCurrentGraph action
 */
export function createGetCurrentGraphAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_CURRENT_GRAPH,
    description: 'Get information about the current graph being edited',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      const narrativeGraph = state.graphs.byId[GRAPH_SCOPE.NARRATIVE];
      const storyletGraph = state.graphs.byId[GRAPH_SCOPE.STORYLET];
      const activeScope = state.graphScope;

      const currentGraph = activeScope === GRAPH_SCOPE.NARRATIVE ? narrativeGraph : storyletGraph;

      if (!currentGraph) {
        return { error: 'No graph selected' };
      }

      return {
        id: currentGraph.id,
        title: currentGraph.title,
        kind: currentGraph.kind,
        scope: activeScope,
        nodeCount: currentGraph.flow?.nodes?.length ?? 0,
        edgeCount: currentGraph.flow?.edges?.length ?? 0,
      };
    },
  };
}

/**
 * Create listGraphs action
 */
export function createListGraphsAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.LIST_GRAPHS,
    description: 'List all available graphs in the current project',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      const narrativeGraph = state.graphs.byId[GRAPH_SCOPE.NARRATIVE];
      const storyletGraph = state.graphs.byId[GRAPH_SCOPE.STORYLET];

      const graphs = [];
      if (narrativeGraph) {
        graphs.push({
          id: narrativeGraph.id,
          title: narrativeGraph.title,
          kind: narrativeGraph.kind,
          scope: GRAPH_SCOPE.NARRATIVE,
          isActive: state.graphScope === GRAPH_SCOPE.NARRATIVE,
        });
      }
      if (storyletGraph) {
        graphs.push({
          id: storyletGraph.id,
          title: storyletGraph.title,
          kind: storyletGraph.kind,
          scope: GRAPH_SCOPE.STORYLET,
          isActive: state.graphScope === GRAPH_SCOPE.STORYLET,
        });
      }

      return { graphs };
    },
  };
}

/**
 * Create switchGraph action
 */
export function createSwitchGraphAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.SWITCH_GRAPH,
    description: 'Switch to a different graph in the forge workspace',
    parameters: [
      {
        name: 'graphId',
        type: 'string',
        description: 'The ID of the graph to switch to',
        required: true,
      },
      {
        name: 'scope',
        type: 'string',
        description: 'The scope of the graph (narrative or storylet)',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const graphId = args.graphId as string;
      const scope = (args.scope as string) || undefined;

      if (!graphId) {
        throw new Error('graphId is required');
      }

      const state = workspaceStore.getState();
      
      // Determine scope
      let targetScope = scope as typeof GRAPH_SCOPE.NARRATIVE | typeof GRAPH_SCOPE.STORYLET | undefined;
      if (!targetScope) {
        // Auto-detect scope based on graph ID
        if (state.graphs.byId[GRAPH_SCOPE.NARRATIVE]?.id === (graphId as unknown as number)) {
          targetScope = GRAPH_SCOPE.NARRATIVE;
        } else if (state.graphs.byId[GRAPH_SCOPE.STORYLET]?.id === (graphId as unknown as number)) {
          targetScope = GRAPH_SCOPE.STORYLET;
        } else {
          throw new Error(`Graph with ID ${graphId} not found`);
        }
      }

      // Switch scope if needed
      if (state.graphScope !== targetScope) {
        state.actions.setGraphScope(targetScope);
      }

      return { success: true, message: `Switched to graph: ${graphId}`, graphId, scope: targetScope };
    },
  };
}

/**
 * Create getFlagSchema action
 */
export function createGetFlagSchemaAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_FLAG_SCHEMA,
    description: 'Get the current flag schema configuration',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      const flagSchema = state.activeFlagSchema;

      if (!flagSchema) {
        return { error: 'No flag schema loaded' };
      }

      return {
        categories: flagSchema.categories,
        flagCount: flagSchema.flags?.length ?? 0,
        flags: flagSchema.flags?.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          category: f.category,
        })),
      };
    },
  };
}

/**
 * Create getGameState action
 */
export function createGetGameStateAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_GAME_STATE,
    description: 'Get the current game state (flag values)',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      const gameState = state.activeGameState;
      const activeGameStateId = state.activeGameStateId;
      const activeGameStateRecord = activeGameStateId ? state.gameStatesById[String(activeGameStateId)] : undefined;

      if (!gameState) {
        return { error: 'No game state loaded' };
      }

      return {
        id: activeGameStateId ?? undefined,
        name: activeGameStateRecord?.name,
        flagCount: Object.keys(gameState.flags || {}).length,
        flags: gameState.flags,
      };
    },
  };
}

/**
 * Create all workspace actions
 */
export function createForgeWorkspaceActions(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]>[] {
  return [
    createGetCurrentGraphAction(workspaceStore),
    createListGraphsAction(workspaceStore),
    createSwitchGraphAction(workspaceStore),
    createGetFlagSchemaAction(workspaceStore),
    createGetGameStateAction(workspaceStore),
  ];
}
