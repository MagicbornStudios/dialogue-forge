import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '../writer-workspace-store';
import type { WriterDataAdapter } from '@/writer/lib/data-adapter/writer-adapter';
import type { ForgeDataAdapter } from '@/forge/adapters/forge-data-adapter';
import type { EventSink } from '@/writer/events/writer-events';
import { extractNarrativeHierarchySync } from '@/writer/lib/sync/narrative-graph-sync';
import { PAGE_TYPE } from '@/forge/types/narrative';

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
        // Extract hierarchy from graph using current database state
        // Note: acts and chapters are now part of unified pages collection
        // Filter pages by type for backward compatibility
        const acts = state.pages?.filter(p => p.pageType === PAGE_TYPE.ACT) ?? [];
        const chapters = state.pages?.filter(p => p.pageType === PAGE_TYPE.CHAPTER) ?? [];
        const pages = state.pages?.filter(p => p.pageType === PAGE_TYPE.PAGE) ?? [];
        
        const hierarchy = extractNarrativeHierarchySync(
          narrativeGraph,
          acts,
          chapters,
          pages
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
