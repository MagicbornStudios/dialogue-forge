import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '../writer-workspace-store';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@/writer/types/forge-data-adapter';
import type { EventSink } from '@/writer/events/writer-events';
import { extractNarrativeHierarchySync } from '@/writer/lib/sync/narrative-graph-sync';

/**
 * Setup subscriptions for side-effect events.
 * These subscriptions handle automatic behaviors like loading content when project changes.
 */
export function setupWriterWorkspaceSubscriptions(
  domainStore: StoreApi<WriterWorkspaceState>,
  eventSink: EventSink,
  dataAdapter?: WriterDataAdapter,
  forgeDataAdapter?: WriterForgeDataAdapter
) {
  if (!dataAdapter) return;

  // Track in-flight requests to prevent duplicates
  const inFlightRequests = new Set<string>();

  // Subscribe to selected graph ID changes and load the graph
  domainStore.subscribe(
    async (state, prevState) => {
      const selectedId = state.selectedNarrativeGraphId;
      const prevId = prevState.selectedNarrativeGraphId;
      
      if (selectedId === prevId) return;
      
      if (selectedId && forgeDataAdapter) {
        try {
          const graph = await forgeDataAdapter.getGraph(selectedId);
          domainStore.getState().actions.setNarrativeGraph(graph);
        } catch (error) {
          console.error('Failed to load selected narrative graph:', error);
          domainStore.getState().actions.setNarrativeGraph(null);
        }
      } else {
        domainStore.getState().actions.setNarrativeGraph(null);
      }
    }
  );

  // Subscribe to narrative graph changes and sync hierarchy
  domainStore.subscribe(
    async (state, prevState) => {
      const narrativeGraph = state.narrativeGraph;
      const prevNarrativeGraph = prevState.narrativeGraph;
      
      // Only process if graph actually changed
      if (narrativeGraph === prevNarrativeGraph) return;
      
      if (narrativeGraph && dataAdapter) {
        // Extract hierarchy from graph using unified pages collection
        // All pages (acts, chapters, content pages) are in the same array
        const hierarchy = extractNarrativeHierarchySync(
          narrativeGraph,
          state.pages
        );
        
        // Update store with hierarchy
        domainStore.getState().actions.setNarrativeHierarchy(hierarchy);
        
        // TODO: Sync graph to database (create missing entries)
        // This is handled by the Forge editor when nodes are created
        // But we could also do a background sync here if needed
      } else {
        // Clear hierarchy if no graph
        domainStore.getState().actions.setNarrativeHierarchy(null);
      }
    }
  );

  // Subscribe to pages changes to rebuild hierarchy if graph exists
  domainStore.subscribe(
    async (state, prevState) => {
      const narrativeGraph = state.narrativeGraph;
      if (!narrativeGraph || !dataAdapter) return;
      
      // Rebuild hierarchy when pages change
      const pagesChanged = state.pages !== prevState.pages;
      
      if (pagesChanged) {
        const hierarchy = extractNarrativeHierarchySync(
          narrativeGraph,
          state.pages
        );
        
        domainStore.getState().actions.setNarrativeHierarchy(hierarchy);
      }
    }
  );
}
