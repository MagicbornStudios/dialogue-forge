import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '../writer-workspace-store';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { ForgeDataAdapter } from '@/forge/adapters/forge-data-adapter';
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
  forgeDataAdapter?: ForgeDataAdapter
) {
  if (!dataAdapter) return;

  // Track in-flight requests to prevent duplicates
  const inFlightRequests = new Set<string>();

  // Subscribe to narrative graph changes and sync hierarchy
  domainStore.subscribe(
    async (state, prevState) => {
      const narrativeGraph = state.narrativeGraph;
      const prevNarrativeGraph = prevState.narrativeGraph;
      
      // Only process if graph actually changed
      if (narrativeGraph === prevNarrativeGraph) return;
      
      if (narrativeGraph && dataAdapter) {
        // Extract hierarchy from graph using current database state
        const hierarchy = extractNarrativeHierarchySync(
          narrativeGraph,
          state.acts,
          state.chapters,
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

  // Subscribe to acts/chapters/pages changes to rebuild hierarchy if graph exists
  domainStore.subscribe(
    async (state, prevState) => {
      const narrativeGraph = state.narrativeGraph;
      if (!narrativeGraph || !dataAdapter) return;
      
      // Rebuild hierarchy when content changes
      const actsChanged = state.acts !== prevState.acts;
      const chaptersChanged = state.chapters !== prevState.chapters;
      const pagesChanged = state.pages !== prevState.pages;
      
      if (actsChanged || chaptersChanged || pagesChanged) {
        const hierarchy = extractNarrativeHierarchySync(
          narrativeGraph,
          state.acts,
          state.chapters,
          state.pages
        );
        
        domainStore.getState().actions.setNarrativeHierarchy(hierarchy);
      }
    }
  );
}
