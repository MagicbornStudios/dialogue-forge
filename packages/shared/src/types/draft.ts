import type { ForgePage, PageType } from '@magicborn/shared/types/narrative';

export const DRAFT_PAGE_OPERATION_KIND = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type DraftPageOperationKind =
  typeof DRAFT_PAGE_OPERATION_KIND[keyof typeof DRAFT_PAGE_OPERATION_KIND];

export type DraftPageOperation<TPage = ForgePage> = {
  kind: DraftPageOperationKind;
  page: TPage;
  previous?: TPage | null;
};

export type DraftDeltaIds = {
  added: string[];
  updated: string[];
  removed: string[];
};

export type DraftPendingPageCreation = {
  nodeId: string;
  pageType: PageType;
  title: string;
  order: number;
  projectId: number;
  parentNodeId?: string | null;
  parentPageId?: number | null;
};

export type DraftCollectionDelta<TItem> = {
  added: TItem[];
  updated: TItem[];
  removed: TItem[];
};

export const DRAFT_COLLECTION_ACTION = {
  ADDED: 'added',
  UPDATED: 'updated',
  REMOVED: 'removed',
} as const;

export type DraftCollectionAction =
  typeof DRAFT_COLLECTION_ACTION[keyof typeof DRAFT_COLLECTION_ACTION];

export type DraftDelta<TNode = unknown, TEdge = unknown, TViewport = unknown, TMeta = Record<string, unknown>, TPageOp = DraftPageOperation> = {
  nodes: DraftCollectionDelta<TNode>;
  edges: DraftCollectionDelta<TEdge>;
  viewport?: TViewport | null;
  meta?: Partial<TMeta>;
  nodeIds?: DraftDeltaIds;
  edgeIds?: DraftDeltaIds;
  pendingPageCreations?: DraftPendingPageCreation[];
  pendingPageOperations?: TPageOp[];
};

export type DraftState<TDraft, TDelta = DraftDelta, TPageOp = DraftPageOperation> = {
  committed: TDraft;
  draft: TDraft;
  delta: TDelta;
  pendingPageOperations: TPageOp[];
  isDirty: boolean;
};

export type DraftActions<TDraft, TDelta = DraftDelta, TPageOp = DraftPageOperation> = {
  setDraft: (draft: TDraft) => void;
  setCommitted: (committed: TDraft) => void;
  clearDraft: () => void;
  calculateDelta: (committed: TDraft, draft: TDraft) => TDelta;
  applyDelta: (draft: TDraft, delta: TDelta) => TDraft;
  queuePageOperation: (operation: TPageOp) => void;
  clearPageOperations: () => void;
};
