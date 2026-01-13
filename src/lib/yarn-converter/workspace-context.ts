/**
 * Workspace Context Integration
 * 
 * Integrates yarn converter with ForgeWorkspaceStore for graph resolution.
 * Uses the existing cache-first resolver pattern from the workspace store.
 */

import type { ForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';
import type { ForgeGraphDoc } from '@/src/types/forge/forge-graph';
import type { YarnConverterContext } from './types';

/**
 * Create a YarnConverterContext from a ForgeWorkspaceStore
 * 
 * This integrates with the existing workspace store pattern:
 * - Uses graphs.byId cache for fast lookups
 * - Uses ensureGraph action which implements cache-first resolver
 * - Tracks visited graphs to prevent circular references
 * 
 * @param store - The ForgeWorkspaceStore instance
 * @returns YarnConverterContext configured to use the workspace store
 */
export function createWorkspaceContext(
  store: ForgeWorkspaceStore
): YarnConverterContext {
  const visitedGraphs = new Set<number>();
  
  return {
    workspaceStore: store,
    
    getGraphFromCache: (graphId: string): ForgeGraphDoc | undefined => {
      const state = store.getState();
      return state.graphs.byId[graphId];
    },
    
    ensureGraph: async (graphId: string): Promise<ForgeGraphDoc> => {
      const state = store.getState();
      
      // Check cache first (workspace store's cache-first pattern)
      const cached = state.graphs.byId[graphId];
      if (cached && state.graphs.statusById[graphId] === 'ready') {
        return cached;
      }
      
      // Use workspace store's ensureGraph action
      // This will check cache, then fetch via adapter if needed
      await state.actions.ensureGraph(graphId, 'storylet');
      
      // Get from cache after ensure
      const stateAfter = store.getState();
      const graph = stateAfter.graphs.byId[graphId];
      
      if (!graph) {
        throw new Error(`Failed to load graph ${graphId}`);
      }
      
      return graph;
    },
    
    visitedGraphs,
  };
}

/**
 * Create a minimal context without workspace store
 * 
 * For cases where workspace store is not available (e.g., standalone conversion).
 * Graph resolution will not be available in this context.
 * 
 * @returns Minimal YarnConverterContext
 */
export function createMinimalContext(): YarnConverterContext {
  return {
    visitedGraphs: new Set<number>(),
  };
}
