import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '../writer-workspace-store';
import type { ForgeGraphDoc } from '@magicborn/shared/types/forge-graph';
import type { EventSink } from '@magicborn/writer/events/writer-events';
import { extractNarrativeHierarchySync } from '@magicborn/writer/lib/sync/narrative-graph-sync';

export type FetchNarrativeGraphCallback = (id: number) => Promise<ForgeGraphDoc>;

/**
 * Setup subscriptions for side-effect events.
 * fetchNarrativeGraph: when provided, used to load the selected narrative graph when selectedNarrativeGraphId changes.
 */
export function setupWriterWorkspaceSubscriptions(
  domainStore: StoreApi<WriterWorkspaceState>,
  _eventSink: EventSink,
  fetchNarrativeGraph?: FetchNarrativeGraphCallback
) {
  if (fetchNarrativeGraph) {
    domainStore.subscribe((state, prevState) => {
      const selectedId = state.selectedNarrativeGraphId;
      const prevId = prevState.selectedNarrativeGraphId;
      if (selectedId === prevId) return;
      if (selectedId) {
        fetchNarrativeGraph(selectedId)
          .then((graph) => domainStore.getState().actions.setNarrativeGraph(graph))
          .catch((error) => {
            console.error('Failed to load selected narrative graph:', error);
            domainStore.getState().actions.setNarrativeGraph(null);
          });
      } else {
        domainStore.getState().actions.setNarrativeGraph(null);
      }
    });
  }

  domainStore.subscribe((state, prevState) => {
    const narrativeGraph = state.draftGraph ?? state.narrativeGraph;
    const prevNarrativeGraph = prevState.draftGraph ?? prevState.narrativeGraph;
    if (narrativeGraph === prevNarrativeGraph) return;
    if (narrativeGraph) {
      const hierarchy = extractNarrativeHierarchySync(narrativeGraph, state.pages);
      domainStore.getState().actions.setNarrativeHierarchy(hierarchy);
    } else {
      domainStore.getState().actions.setNarrativeHierarchy(null);
    }
  });

  domainStore.subscribe((state, prevState) => {
    const narrativeGraph = state.draftGraph ?? state.narrativeGraph;
    if (!narrativeGraph) return;
    if (state.pages !== prevState.pages) {
      const hierarchy = extractNarrativeHierarchySync(narrativeGraph, state.pages);
      domainStore.getState().actions.setNarrativeHierarchy(hierarchy);
    }
  });
}
