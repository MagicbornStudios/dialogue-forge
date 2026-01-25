import { DRAFT_COLLECTION_ACTION, type DraftCollectionAction, type DraftCollectionDelta, type DraftDelta } from '@/shared/types/draft';
import type { ForgeGraphDoc, ForgeReactFlowEdge, ForgeReactFlowNode } from '@/shared/types/forge-graph';

type ForgeGraphDraftMeta = Pick<ForgeGraphDoc, 'title' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>;

type ForgeGraphDraftDelta = DraftDelta<
  ForgeReactFlowNode,
  ForgeReactFlowEdge,
  ForgeGraphDoc['flow']['viewport'],
  ForgeGraphDraftMeta
>;

type EntityWithId = {
  id?: string | null;
};

const hasSameValue = <T,>(left: T, right: T): boolean => JSON.stringify(left) === JSON.stringify(right);

const buildCollectionDelta = <TItem extends EntityWithId>(
  committed: TItem[],
  draft: TItem[]
): DraftCollectionDelta<TItem> => {
  const committedMap = new Map<string, TItem>();
  committed.forEach((item) => {
    if (item.id) {
      committedMap.set(item.id, item);
    }
  });

  const draftMap = new Map<string, TItem>();
  draft.forEach((item) => {
    if (item.id) {
      draftMap.set(item.id, item);
    }
  });

  const added: TItem[] = [];
  const updated: TItem[] = [];
  const removed: TItem[] = [];

  draftMap.forEach((draftItem, id) => {
    const committedItem = committedMap.get(id);
    if (!committedItem) {
      added.push(draftItem);
      return;
    }
    if (!hasSameValue(committedItem, draftItem)) {
      updated.push(draftItem);
    }
  });

  committedMap.forEach((committedItem, id) => {
    if (!draftMap.has(id)) {
      removed.push(committedItem);
    }
  });

  return { added, updated, removed };
};

const applyCollectionDelta = <TItem extends EntityWithId>(
  items: TItem[],
  delta: DraftCollectionDelta<TItem>
): TItem[] => {
  const map = new Map<string, TItem>();
  items.forEach((item) => {
    if (item.id) {
      map.set(item.id, item);
    }
  });

  delta.removed.forEach((item) => {
    if (item.id) {
      map.delete(item.id);
    }
  });

  const upsert = (item: TItem) => {
    if (item.id) {
      map.set(item.id, item);
    }
  };

  delta.updated.forEach(upsert);
  delta.added.forEach(upsert);

  return Array.from(map.values());
};

const mergeCollectionDeltas = <TItem extends EntityWithId>(
  delta1: DraftCollectionDelta<TItem>,
  delta2: DraftCollectionDelta<TItem>
): DraftCollectionDelta<TItem> => {
  const merged = new Map<string, { action: DraftCollectionAction; item: TItem }>();

  const applyAction = (action: DraftCollectionAction, item: TItem) => {
    if (!item.id) {
      return;
    }
    merged.set(item.id, { action, item });
  };

  delta1.added.forEach((item) => applyAction(DRAFT_COLLECTION_ACTION.ADDED, item));
  delta1.updated.forEach((item) => applyAction(DRAFT_COLLECTION_ACTION.UPDATED, item));
  delta1.removed.forEach((item) => applyAction(DRAFT_COLLECTION_ACTION.REMOVED, item));

  delta2.removed.forEach((item) => applyAction(DRAFT_COLLECTION_ACTION.REMOVED, item));
  delta2.updated.forEach((item) => {
    if (item.id && merged.get(item.id)?.action === DRAFT_COLLECTION_ACTION.ADDED) {
      applyAction(DRAFT_COLLECTION_ACTION.ADDED, item);
      return;
    }
    applyAction(DRAFT_COLLECTION_ACTION.UPDATED, item);
  });
  delta2.added.forEach((item) => applyAction(DRAFT_COLLECTION_ACTION.ADDED, item));

  const added: TItem[] = [];
  const updated: TItem[] = [];
  const removed: TItem[] = [];

  merged.forEach(({ action, item }) => {
    if (action === DRAFT_COLLECTION_ACTION.ADDED) {
      added.push(item);
      return;
    }
    if (action === DRAFT_COLLECTION_ACTION.UPDATED) {
      updated.push(item);
      return;
    }
    removed.push(item);
  });

  return { added, updated, removed };
};

const extractIds = <TItem extends EntityWithId>(delta: DraftCollectionDelta<TItem>): string[] => {
  const ids = new Set<string>();
  [delta.added, delta.updated, delta.removed].forEach((items) => {
    items.forEach((item) => {
      if (item.id) {
        ids.add(item.id);
      }
    });
  });
  return Array.from(ids);
};

const buildMetaDelta = (
  committed: ForgeGraphDoc,
  draft: ForgeGraphDoc
): Partial<ForgeGraphDraftMeta> | undefined => {
  const meta: Partial<ForgeGraphDraftMeta> = {};

  if (committed.title !== draft.title) {
    meta.title = draft.title;
  }
  if (committed.startNodeId !== draft.startNodeId) {
    meta.startNodeId = draft.startNodeId;
  }
  if (!hasSameValue(committed.endNodeIds, draft.endNodeIds)) {
    meta.endNodeIds = draft.endNodeIds;
  }
  if (committed.compiledYarn !== draft.compiledYarn) {
    meta.compiledYarn = draft.compiledYarn;
  }

  return Object.keys(meta).length > 0 ? meta : undefined;
};

export const calculateDelta = (committed: ForgeGraphDoc, draft: ForgeGraphDoc): ForgeGraphDraftDelta => {
  const nodes = buildCollectionDelta(committed.flow.nodes, draft.flow.nodes);
  const edges = buildCollectionDelta(committed.flow.edges, draft.flow.edges);
  const viewportChanged = !hasSameValue(committed.flow.viewport, draft.flow.viewport);

  return {
    nodes,
    edges,
    viewport: viewportChanged ? draft.flow.viewport ?? null : undefined,
    meta: buildMetaDelta(committed, draft),
  };
};

export const applyDeltaToGraph = (graph: ForgeGraphDoc, delta: ForgeGraphDraftDelta): ForgeGraphDoc => {
  const nextFlow = {
    ...graph.flow,
    nodes: applyCollectionDelta(graph.flow.nodes, delta.nodes),
    edges: applyCollectionDelta(graph.flow.edges, delta.edges),
    viewport: delta.viewport !== undefined ? delta.viewport ?? undefined : graph.flow.viewport,
  };

  return {
    ...graph,
    ...delta.meta,
    flow: nextFlow,
  };
};

export const mergeDeltas = (delta1: ForgeGraphDraftDelta, delta2: ForgeGraphDraftDelta): ForgeGraphDraftDelta => {
  const meta = {
    ...(delta1.meta ?? {}),
    ...(delta2.meta ?? {}),
  };

  const merged: ForgeGraphDraftDelta = {
    nodes: mergeCollectionDeltas(delta1.nodes, delta2.nodes),
    edges: mergeCollectionDeltas(delta1.edges, delta2.edges),
  };

  if (Object.keys(meta).length > 0) {
    merged.meta = meta;
  }

  if ('viewport' in delta2) {
    merged.viewport = delta2.viewport ?? null;
  } else if ('viewport' in delta1) {
    merged.viewport = delta1.viewport ?? null;
  }

  if (delta1.pendingPageOperations || delta2.pendingPageOperations) {
    merged.pendingPageOperations = [
      ...(delta1.pendingPageOperations ?? []),
      ...(delta2.pendingPageOperations ?? []),
    ];
  }

  return merged;
};

export const getAffectedNodeIds = (delta: ForgeGraphDraftDelta): string[] => extractIds(delta.nodes);

export const getAffectedEdgeIds = (delta: ForgeGraphDraftDelta): string[] => extractIds(delta.edges);
