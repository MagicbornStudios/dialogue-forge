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
import { FORGE_ACTION_NAME } from '@/forge/copilotkit/constants/forge-action-names';
import { GRAPH_SCOPE } from '@/forge/types/constants';
import { FORGE_GRAPH_KIND, FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

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
      // Get graphs using active graph IDs, not scope constants
      const narrativeGraphId = state.activeNarrativeGraphId;
      const storyletGraphId = state.activeStoryletGraphId;
      const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;
      const storyletGraph = storyletGraphId ? state.graphs.byId[storyletGraphId] : null;
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
      // Get graphs using active graph IDs, not scope constants
      const narrativeGraphId = state.activeNarrativeGraphId;
      const storyletGraphId = state.activeStoryletGraphId;
      const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;
      const storyletGraph = storyletGraphId ? state.graphs.byId[storyletGraphId] : null;

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
        const narrativeGraphId = state.activeNarrativeGraphId;
        const storyletGraphId = state.activeStoryletGraphId;
        if (narrativeGraphId && String(narrativeGraphId) === String(graphId)) {
          targetScope = GRAPH_SCOPE.NARRATIVE;
        } else if (storyletGraphId && String(storyletGraphId) === String(graphId)) {
          targetScope = GRAPH_SCOPE.STORYLET;
        } else {
          // Check if graph exists in cache and infer scope from kind
          const graph = state.graphs.byId[String(graphId)];
          if (graph) {
            targetScope = graph.kind === FORGE_GRAPH_KIND.NARRATIVE ? GRAPH_SCOPE.NARRATIVE : GRAPH_SCOPE.STORYLET;
          } else {
            throw new Error(`Graph with ID ${graphId} not found`);
          }
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
 * Create getChapters action
 */
export function createGetChaptersAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_CHAPTERS,
    description: 'Get all chapters in the narrative graph',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      // Get narrative graph using active graph ID, not scope constant
      const narrativeGraphId = state.activeNarrativeGraphId;
      const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;

      if (!narrativeGraph?.flow?.nodes) {
        return { chapters: [] };
      }

      const chapters = narrativeGraph.flow.nodes
        .filter((node) => node.data?.node?.type === FORGE_NODE_TYPE.CHAPTER)
        .map((node) => ({
          id: node.id,
          label: node.data?.node?.label || node.id,
          content: node.data?.node?.content || '',
          position: { x: node.position.x, y: node.position.y },
        }));

      return { chapters, count: chapters.length };
    },
  };
}

/**
 * Create getActs action
 */
export function createGetActsAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_ACTS,
    description: 'Get all acts in the narrative graph',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      // Get narrative graph using active graph ID, not scope constant
      const narrativeGraphId = state.activeNarrativeGraphId;
      const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;

      if (!narrativeGraph?.flow?.nodes) {
        return { acts: [] };
      }

      const acts = narrativeGraph.flow.nodes
        .filter((node) => node.data?.node?.type === FORGE_NODE_TYPE.ACT)
        .map((node) => ({
          id: node.id,
          label: node.data?.node?.label || node.id,
          content: node.data?.node?.content || '',
          position: { x: node.position.x, y: node.position.y },
        }));

      return { acts, count: acts.length };
    },
  };
}

/**
 * Create getPages action
 */
export function createGetPagesAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_PAGES,
    description: 'Get all pages in the narrative graph',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      // Get narrative graph using active graph ID, not scope constant
      const narrativeGraphId = state.activeNarrativeGraphId;
      const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;

      if (!narrativeGraph?.flow?.nodes) {
        return { pages: [] };
      }

      const pages = narrativeGraph.flow.nodes
        .filter((node) => node.data?.node?.type === FORGE_NODE_TYPE.PAGE)
        .map((node) => ({
          id: node.id,
          label: node.data?.node?.label || node.id,
          content: node.data?.node?.content || '',
          position: { x: node.position.x, y: node.position.y },
        }));

      return { pages, count: pages.length };
    },
  };
}

/**
 * Create getGraph action (get a specific graph by ID)
 */
export function createGetGraphAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.GET_GRAPH,
    description: 'Get a specific graph by ID for more context',
    parameters: [
      {
        name: 'graphId',
        type: 'string',
        description: 'The ID of the graph to retrieve',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const graphId = args.graphId as string;
      if (!graphId) {
        throw new Error('graphId is required');
      }

      const state = workspaceStore.getState();
      
      // Look up graph by ID in the cache
      const graph = state.graphs.byId[String(graphId)] || null;

      if (!graph) {
        return { error: `Graph with ID ${graphId} not found` };
      }

      return {
        id: graph.id,
        title: graph.title,
        kind: graph.kind,
        nodeCount: graph.flow?.nodes?.length ?? 0,
        edgeCount: graph.flow?.edges?.length ?? 0,
        nodes: graph.flow?.nodes?.map((node) => ({
          id: node.id,
          type: node.data?.node?.type,
          label: node.data?.node?.label || node.id,
        })) || [],
      };
    },
  };
}

/**
 * Create expand editor action
 */
export function createExpandEditorAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.EXPAND_EDITOR,
    description: 'Expand an editor (narrative, storylet, or node editor) to fullscreen mode',
    parameters: [
      {
        name: 'editorType',
        type: 'string',
        description: 'The type of editor to expand: "narrativeEditor", "storyletEditor", or "nodeEditor"',
        required: true,
        enum: ['narrativeEditor', 'storyletEditor', 'nodeEditor'],
      },
    ],
    handler: async ({ editorType }: { editorType: 'narrativeEditor' | 'storyletEditor' | 'nodeEditor' }) => {
      const state = workspaceStore.getState();
      state.actions.dockPanel(editorType);
      return { success: true, message: `Expanded ${editorType} to fullscreen` };
    },
  };
}

/**
 * Create minimize editor action
 */
export function createMinimizeEditorAction(
  workspaceStore: StoreApi<ForgeWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: FORGE_ACTION_NAME.WORKSPACE.MINIMIZE_EDITOR,
    description: 'Minimize an editor (narrative, storylet, or node editor) from fullscreen mode back to normal view',
    parameters: [
      {
        name: 'editorType',
        type: 'string',
        description: 'The type of editor to minimize: "narrativeEditor", "storyletEditor", or "nodeEditor"',
        required: true,
        enum: ['narrativeEditor', 'storyletEditor', 'nodeEditor'],
      },
    ],
    handler: async ({ editorType }: { editorType: 'narrativeEditor' | 'storyletEditor' | 'nodeEditor' }) => {
      const state = workspaceStore.getState();
      state.actions.undockPanel(editorType);
      return { success: true, message: `Minimized ${editorType} from fullscreen` };
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
    createGetChaptersAction(workspaceStore),
    createGetActsAction(workspaceStore),
    createGetPagesAction(workspaceStore),
    createGetGraphAction(workspaceStore),
    createExpandEditorAction(workspaceStore),
    createMinimizeEditorAction(workspaceStore),
  ];
}
