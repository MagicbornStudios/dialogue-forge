import type { StateCreator } from "zustand"

import type { ForgeGraphDoc } from "@magicborn/forge/types"
import type { ForgeNode } from "@magicborn/forge/types/forge-graph"
import { PAGE_TYPE, type ForgePage, type PageType } from "@magicborn/forge/types/narrative"
import { validateNarrativeGraph, type GraphValidationResult } from "@magicborn/forge/lib/graph-validation"
import { calculateDelta } from "@magicborn/shared/lib/draft/draft-helpers"
import type { DraftPendingPageCreation } from "@magicborn/shared/types/draft"
import { createDraftSlice, type DraftSlice } from "@magicborn/shared/store/draft-slice"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export type ForgeDraftDelta = ReturnType<typeof calculateDelta>

export type ForgeDraftSlice = DraftSlice<ForgeGraphDoc, ForgeDraftDelta, GraphValidationResult>

export type OnCommitForgeDraft = (
  draft: ForgeGraphDoc,
  deltas: ForgeDraftDelta[]
) => Promise<ForgeGraphDoc>

/** Commit surface needed for draft persistence. */
export type ForgeDraftCommitApi = {
  createPage(input: {
    projectId: number
    pageType: PageType
    title: string
    order: number
    parent?: number | null
    narrativeGraph?: number | null
  }): Promise<ForgePage>
  updateGraph(graphId: number, patch: Partial<Pick<ForgeGraphDoc, "title" | "flow" | "startNodeId" | "endNodeIds" | "compiledYarn">>): Promise<ForgeGraphDoc>
}

function resolvePendingPageCreations(deltas: ForgeDraftDelta[]): DraftPendingPageCreation[] {
  const latestDelta = deltas[deltas.length - 1]
  return latestDelta?.pendingPageCreations ?? []
}

function patchGraphWithPageIds(graph: ForgeGraphDoc, createdPages: Map<string, ForgePage>): ForgeGraphDoc {
  if (!createdPages.size) return graph
  return {
    ...graph,
    flow: {
      ...graph.flow,
      nodes: graph.flow.nodes.map((node) => {
        const createdPage = createdPages.get(node.id)
        if (!createdPage) return node
        const nodeData = (node.data ?? {}) as ForgeNode
        return {
          ...node,
          data: { ...nodeData, pageId: createdPage.id },
        }
      }),
    },
  }
}

/** Persist a Forge draft by creating pending pages, then updating the graph. */
export async function commitForgeDraft(
  draft: ForgeGraphDoc,
  deltas: ForgeDraftDelta[],
  api: ForgeDraftCommitApi
): Promise<ForgeGraphDoc> {
  const pendingPageCreations = resolvePendingPageCreations(deltas)
  const createdPages = new Map<string, ForgePage>()
  const pageTypeOrder = [PAGE_TYPE.ACT, PAGE_TYPE.CHAPTER, PAGE_TYPE.PAGE]

  for (const pageType of pageTypeOrder) {
    const creations = pendingPageCreations.filter((c) => c.pageType === pageType)
    for (const creation of creations) {
      const parentId =
        creation.parentPageId ??
        (creation.parentNodeId ? createdPages.get(creation.parentNodeId)?.id ?? null : null)
      const page = await api.createPage({
        projectId: creation.projectId,
        pageType: creation.pageType,
        title: creation.title,
        order: creation.order,
        parent: parentId ?? null,
        narrativeGraph: draft.project ? Number(draft.project) : undefined,
      })
      createdPages.set(creation.nodeId, page)
    }
  }

  const nextDraft = patchGraphWithPageIds(draft, createdPages)
  return api.updateGraph(nextDraft.id, {
    title: nextDraft.title,
    flow: nextDraft.flow,
    startNodeId: nextDraft.startNodeId,
    endNodeIds: nextDraft.endNodeIds,
    compiledYarn: nextDraft.compiledYarn ?? null,
  })
}

export function createForgeDraftSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  initialGraph?: ForgeGraphDoc | null,
  onCommitDraft?: OnCommitForgeDraft
): ForgeDraftSlice {
  return createDraftSlice<ForgeDraftSlice, ForgeGraphDoc, ForgeDraftDelta, GraphValidationResult>(set as any, get as any, {
    initialGraph: initialGraph ?? null,
    validateDraft: (draft) => validateNarrativeGraph(draft),
    onCommitDraft: onCommitDraft
      ? async (draft, deltas) => onCommitDraft(draft, deltas)
      : undefined,
  })
}
