import * as React from 'react';
import { useShallow } from 'zustand/shallow';

import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { calculateDelta } from '@/shared/lib/draft/draft-helpers';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';

type DraftDelta = ReturnType<typeof calculateDelta>;

type DraftVisualIndicators = {
  addedNodeIds: Set<string>;
  modifiedNodeIds: Set<string>;
  addedEdgeIds: Set<string>;
  modifiedEdgeIds: Set<string>;
};

const buildDraftDelta = (
  committedGraph: ForgeGraphDoc | null,
  draftGraph: ForgeGraphDoc | null,
  deltas: DraftDelta[]
): DraftDelta | null => {
  if (deltas.length > 0) {
    return deltas[deltas.length - 1] ?? null;
  }

  if (!committedGraph || !draftGraph) {
    return null;
  }

  return calculateDelta(committedGraph, draftGraph);
};

export const useDraftVisualIndicators = (): DraftVisualIndicators => {
  const { committedGraph, draftGraph, deltas } = useForgeWorkspaceStore(
    useShallow((state) => ({
      committedGraph: state.committedGraph,
      draftGraph: state.draftGraph,
      deltas: state.deltas,
    }))
  );

  const delta = React.useMemo(
    () => buildDraftDelta(committedGraph, draftGraph, deltas),
    [committedGraph, draftGraph, deltas]
  );

  const addedNodeIds = React.useMemo(() => new Set(delta?.nodeIds?.added ?? []), [delta]);
  const modifiedNodeIds = React.useMemo(() => new Set(delta?.nodeIds?.updated ?? []), [delta]);
  const addedEdgeIds = React.useMemo(() => new Set(delta?.edgeIds?.added ?? []), [delta]);
  const modifiedEdgeIds = React.useMemo(() => new Set(delta?.edgeIds?.updated ?? []), [delta]);

  return {
    addedNodeIds,
    modifiedNodeIds,
    addedEdgeIds,
    modifiedEdgeIds,
  };
};
