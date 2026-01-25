import type { StateCreator } from "zustand"

import type { ForgeGraphDoc } from "@/forge/types"
import { validateNarrativeGraph, type GraphValidationResult } from "@/forge/lib/graph-validation"
import { calculateDelta } from "@/shared/lib/draft/draft-helpers"
import { createDraftSlice, type DraftSlice } from "@/shared/store/draft-slice"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export type ForgeDraftDelta = ReturnType<typeof calculateDelta>

export type ForgeDraftSlice = DraftSlice<ForgeGraphDoc, ForgeDraftDelta, GraphValidationResult>

export function createForgeDraftSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  initialGraph?: ForgeGraphDoc | null
): ForgeDraftSlice {
  return createDraftSlice<ForgeDraftSlice, ForgeGraphDoc, ForgeDraftDelta, GraphValidationResult>(set, get, {
    initialGraph: initialGraph ?? null,
    validateDraft: (draft) => validateNarrativeGraph(draft),
  })
}
