import type { StateCreator } from "zustand"

import type { ForgeGraphDoc } from "@magicborn/forge/types"
import { validateNarrativeGraph, type GraphValidationResult } from "@magicborn/forge/lib/graph-validation"
import { calculateDelta } from "@magicborn/shared/lib/draft/draft-helpers"
import type { DraftPendingPageCreation } from "@magicborn/shared/types/draft"
import type { ForgeNode } from "@magicborn/forge/types/forge-graph"
import { PAGE_TYPE, type ForgePage } from "@magicborn/forge/types/narrative"
import { createDraftSlice, type DraftSlice } from "@magicborn/shared/store/draft-slice"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export type ForgeDraftDelta = ReturnType<typeof calculateDelta>

export type ForgeDraftSlice = DraftSlice<ForgeGraphDoc, ForgeDraftDelta, GraphValidationResult>

export function createForgeDraftSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  initialGraph?: ForgeGraphDoc | null
): ForgeDraftSlice {
  const resolvePendingPageCreations = (deltas: ForgeDraftDelta[]): DraftPendingPageCreation[] => {
    const latestDelta = deltas[deltas.length - 1]
    return latestDelta?.pendingPageCreations ?? []
  }

  const patchGraphWithPageIds = (
    graph: ForgeGraphDoc,
    createdPages: Map<string, ForgePage>
  ): ForgeGraphDoc => {
    if (!createdPages.size) {
      return graph
    }

    return {
      ...graph,
      flow: {
        ...graph.flow,
        nodes: graph.flow.nodes.map((node) => {
          const createdPage = createdPages.get(node.id)
          if (!createdPage) {
            return node
          }
          const nodeData = (node.data ?? {}) as ForgeNode
          return {
            ...node,
            data: {
              ...nodeData,
              pageId: createdPage.id,
            },
          }
        }),
      },
    }
  }

  return createDraftSlice<ForgeDraftSlice, ForgeGraphDoc, ForgeDraftDelta, GraphValidationResult>(set as any, get as any, {
    initialGraph: initialGraph ?? null,
    validateDraft: (draft) => validateNarrativeGraph(draft),
    onCommitDraft: async (draft, deltas) => {
      const dataAdapter = get().dataAdapter
      if (!dataAdapter) {
        return draft
      }

      const pendingPageCreations = resolvePendingPageCreations(deltas)
      const createdPages = new Map<string, ForgePage>()
      const pageTypeOrder = [PAGE_TYPE.ACT, PAGE_TYPE.CHAPTER, PAGE_TYPE.PAGE]

      for (const pageType of pageTypeOrder) {
        const creations = pendingPageCreations.filter((creation) => creation.pageType === pageType)
        for (const creation of creations) {
          const parentId =
            creation.parentPageId ??
            (creation.parentNodeId ? createdPages.get(creation.parentNodeId)?.id ?? null : null)

          const page = await dataAdapter.createPage({
            projectId: creation.projectId,
            pageType: creation.pageType,
            title: creation.title,
            order: creation.order,
            parent: parentId ?? null,
          })
          createdPages.set(creation.nodeId, page)
        }
      }

      const nextDraft = patchGraphWithPageIds(draft, createdPages)

      const persistedGraph = await dataAdapter.updateGraph(nextDraft.id, {
        title: nextDraft.title,
        flow: nextDraft.flow,
        startNodeId: nextDraft.startNodeId,
        endNodeIds: nextDraft.endNodeIds,
        compiledYarn: nextDraft.compiledYarn ?? null,
      })

      return persistedGraph
    },
  })
}
