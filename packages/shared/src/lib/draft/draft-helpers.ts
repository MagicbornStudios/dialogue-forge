import {
  DRAFT_COLLECTION_ACTION,
  type DraftCollectionAction,
  type DraftCollectionDelta,
  type DraftDelta,
  type DraftDeltaIds,
  type DraftPendingPageCreation,
} from '@magicborn/shared/types/draft';
import {
  FORGE_NODE_TYPE,
  type ForgeGraphDoc,
  type ForgeNode,
  type ForgeNodeType,
  type ForgeReactFlowEdge,
  type ForgeReactFlowNode,
} from '@magicborn/shared/types/forge-graph';
import { PAGE_TYPE } from '@magicborn/shared/types/narrative';

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

const extractIdsFromItems = <TItem extends EntityWithId>(items: TItem[]): string[] => {
  const ids = new Set<string>();
  items.forEach((item) => {
    if (item.id) {
      ids.add(item.id);
    }
  });
  return Array.from(ids);
};

const buildIdDelta = <TItem extends EntityWithId>(delta: DraftCollectionDelta<TItem>): DraftDeltaIds => ({
  added: extractIdsFromItems(delta.added),
  updated: extractIdsFromItems(delta.updated),
  removed: extractIdsFromItems(delta.removed),
});

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

const resolveNodeType = (node: ForgeReactFlowNode): ForgeNodeType | undefined => {
  const nodeData = node.data as ForgeNode | undefined;
  return (node.type as ForgeNodeType | undefined) ?? nodeData?.type;
};

const findParentNodeByType = (
  graph: ForgeGraphDoc,
  nodeId: string,
  parentType: ForgeNodeType
): ForgeReactFlowNode | null => {
  const incomingEdges = graph.flow.edges.filter((edge) => edge.target === nodeId);
  for (const edge of incomingEdges) {
    const sourceNode = graph.flow.nodes.find((node) => node.id === edge.source);
    if (sourceNode && resolveNodeType(sourceNode) === parentType) {
      return sourceNode;
    }
    const parentOfParent = sourceNode ? findParentNodeByType(graph, sourceNode.id, parentType) : null;
    if (parentOfParent) {
      return parentOfParent;
    }
  }
  return null;
};

const buildPendingPageCreations = (
  draft: ForgeGraphDoc,
  nodesDelta: DraftCollectionDelta<ForgeReactFlowNode>
): DraftPendingPageCreation[] | undefined => {
  const pending: DraftPendingPageCreation[] = [];
  const candidates = nodesDelta.added;
  if (!candidates.length) {
    return undefined;
  }

  const resolveTitle = (nodeType: ForgeNodeType | undefined, nodeData?: ForgeNode): string => {
    if (nodeData?.label) {
      return nodeData.label;
    }
    switch (nodeType) {
      case FORGE_NODE_TYPE.ACT:
        return 'New Act';
      case FORGE_NODE_TYPE.CHAPTER:
        return 'New Chapter';
      case FORGE_NODE_TYPE.PAGE:
        return 'New Page';
      default:
        return 'New Page';
    }
  };

  candidates.forEach((node) => {
    const nodeData = node.data as ForgeNode | undefined;
    const nodeType = resolveNodeType(node);
    if (!nodeType) {
      return;
    }
    const isNarrativeNode =
      nodeType === FORGE_NODE_TYPE.ACT ||
      nodeType === FORGE_NODE_TYPE.CHAPTER ||
      nodeType === FORGE_NODE_TYPE.PAGE;
    if (!isNarrativeNode) {
      return;
    }
    if (nodeData?.pageId) {
      return;
    }

    let pageType: DraftPendingPageCreation['pageType'] | null = null;
    let parentNodeId: string | null = null;
    let parentPageId: number | null = null;

    if (nodeType === FORGE_NODE_TYPE.ACT) {
      pageType = PAGE_TYPE.ACT;
    } else if (nodeType === FORGE_NODE_TYPE.CHAPTER) {
      pageType = PAGE_TYPE.CHAPTER;
      const parentActNode = findParentNodeByType(draft, node.id, FORGE_NODE_TYPE.ACT);
      parentNodeId = parentActNode?.id ?? null;
      parentPageId = (parentActNode?.data as ForgeNode | undefined)?.pageId ?? null;
    } else if (nodeType === FORGE_NODE_TYPE.PAGE) {
      pageType = PAGE_TYPE.PAGE;
      const parentChapterNode = findParentNodeByType(draft, node.id, FORGE_NODE_TYPE.CHAPTER);
      parentNodeId = parentChapterNode?.id ?? null;
      parentPageId = (parentChapterNode?.data as ForgeNode | undefined)?.pageId ?? null;
    }

    if (!pageType) {
      return;
    }

    pending.push({
      nodeId: node.id,
      pageType,
      title: resolveTitle(nodeType, nodeData),
      order: 0,
      projectId: draft.project,
      parentNodeId,
      parentPageId,
    });
  });

  return pending.length ? pending : undefined;
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
  const pendingPageCreations = buildPendingPageCreations(draft, nodes);

  return {
    nodes,
    edges,
    nodeIds: buildIdDelta(nodes),
    edgeIds: buildIdDelta(edges),
    viewport: viewportChanged ? draft.flow.viewport ?? null : undefined,
    meta: buildMetaDelta(committed, draft),
    pendingPageCreations,
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

  merged.nodeIds = buildIdDelta(merged.nodes);
  merged.edgeIds = buildIdDelta(merged.edges);

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

  if (delta1.pendingPageCreations || delta2.pendingPageCreations) {
    const creations = new Map<string, DraftPendingPageCreation>();
    [...(delta1.pendingPageCreations ?? []), ...(delta2.pendingPageCreations ?? [])].forEach((creation) => {
      creations.set(creation.nodeId, creation);
    });
    merged.pendingPageCreations = Array.from(creations.values());
  }

  return merged;
};

export const getAffectedNodeIds = (delta: ForgeGraphDraftDelta): string[] => extractIds(delta.nodes);

export const getAffectedEdgeIds = (delta: ForgeGraphDraftDelta): string[] => extractIds(delta.edges);
