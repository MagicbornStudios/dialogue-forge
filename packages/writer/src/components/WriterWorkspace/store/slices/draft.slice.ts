import type { StateCreator } from 'zustand';

import type { ForgeGraphDoc, ForgeNode } from '@magicborn/shared/types/forge-graph';
import { validateNarrativeGraph, type GraphValidationResult } from '@magicborn/shared/lib/graph-validation';
import { calculateDelta } from '@magicborn/shared/lib/draft/draft-helpers';
import type { DraftPendingPageCreation } from '@magicborn/shared/types/draft';
import { PAGE_TYPE, type ForgePage } from '@magicborn/shared/types/narrative';
import { createDraftSlice, type DraftSlice } from '@magicborn/shared/store/draft-slice';
import type { WriterWorkspaceState } from '../writer-workspace-types';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import type { WriterForgeDataAdapter } from '@magicborn/writer/types/forge-data-adapter';

export type WriterDraftDelta = ReturnType<typeof calculateDelta>;

export type WriterDraftSlice = DraftSlice<ForgeGraphDoc, WriterDraftDelta, GraphValidationResult>;

export function createWriterDraftSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialGraph?: ForgeGraphDoc | null,
  getDataAdapter?: () => WriterDataAdapter | null,
  getForgeDataAdapter?: () => WriterForgeDataAdapter | null
): WriterDraftSlice {
  const resolvePendingPageCreations = (deltas: WriterDraftDelta[]): DraftPendingPageCreation[] => {
    const latestDelta = deltas[deltas.length - 1];
    return latestDelta?.pendingPageCreations ?? [];
  };

  const patchGraphWithPageIds = (
    graph: ForgeGraphDoc,
    createdPages: Map<string, ForgePage>
  ): ForgeGraphDoc => {
    if (!createdPages.size) {
      return graph;
    }

    return {
      ...graph,
      flow: {
        ...graph.flow,
        nodes: graph.flow.nodes.map((node) => {
          const createdPage = createdPages.get(node.id);
          if (!createdPage) {
            return node;
          }
          const nodeData = (node.data ?? {}) as ForgeNode;
          return {
            ...node,
            data: {
              ...nodeData,
              pageId: createdPage.id,
            },
          };
        }),
      },
    };
  };

  const setDraft = set as unknown as Parameters<
    typeof createDraftSlice<
      WriterDraftSlice,
      ForgeGraphDoc,
      WriterDraftDelta,
      GraphValidationResult
    >
  >[0];
  const getDraft = get as unknown as Parameters<
    typeof createDraftSlice<
      WriterDraftSlice,
      ForgeGraphDoc,
      WriterDraftDelta,
      GraphValidationResult
    >
  >[1];

  return createDraftSlice<WriterDraftSlice, ForgeGraphDoc, WriterDraftDelta, GraphValidationResult>(setDraft, getDraft, {
    initialGraph: initialGraph ?? null,
    validateDraft: (draft) => validateNarrativeGraph(draft),
    onCommitDraft: async (draft, deltas) => {
      const dataAdapter = getDataAdapter?.() ?? null;
      const forgeDataAdapter = getForgeDataAdapter?.() ?? null;
      if (!forgeDataAdapter) {
        return draft;
      }

      const pendingPageCreations = resolvePendingPageCreations(deltas);
      const createdPages = new Map<string, ForgePage>();
      const pageTypeOrder = [PAGE_TYPE.ACT, PAGE_TYPE.CHAPTER, PAGE_TYPE.PAGE];

      if (dataAdapter && pendingPageCreations.length > 0) {
        for (const pageType of pageTypeOrder) {
          const creations = pendingPageCreations.filter((creation) => creation.pageType === pageType);
          for (const creation of creations) {
            const parentId =
              creation.parentPageId ??
              (creation.parentNodeId ? createdPages.get(creation.parentNodeId)?.id ?? null : null);

            const page = await dataAdapter.createPage({
              projectId: creation.projectId,
              pageType: creation.pageType,
              title: creation.title,
              order: creation.order,
              parent: parentId ?? null,
            });
            createdPages.set(creation.nodeId, page);
          }
        }
      }

      const nextDraft = patchGraphWithPageIds(draft, createdPages);

      const persistedGraph = await forgeDataAdapter.updateGraph(nextDraft.id, {
        title: nextDraft.title,
        flow: nextDraft.flow,
        startNodeId: nextDraft.startNodeId,
        endNodeIds: nextDraft.endNodeIds,
        compiledYarn: nextDraft.compiledYarn ?? null,
      });

      return persistedGraph;
    },
  });
}
