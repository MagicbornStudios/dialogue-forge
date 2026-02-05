import type { StateCreator } from 'zustand';

import type { ForgeGraphDoc } from '@magicborn/shared/types/forge-graph';
import { validateNarrativeGraph, type GraphValidationResult } from '@magicborn/shared/lib/graph-validation';
import { calculateDelta } from '@magicborn/shared/lib/draft/draft-helpers';
import { createDraftSlice, type DraftSlice } from '@magicborn/shared/store/draft-slice';
import type { WriterWorkspaceState } from '../writer-workspace-types';

export type WriterDraftDelta = ReturnType<typeof calculateDelta>;

export type WriterDraftSlice = DraftSlice<ForgeGraphDoc, WriterDraftDelta, GraphValidationResult>;

export type OnCommitWriterDraft = (
  draft: ForgeGraphDoc,
  deltas: WriterDraftDelta[]
) => Promise<ForgeGraphDoc>;

export function createWriterDraftSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1],
  initialGraph?: ForgeGraphDoc | null,
  onCommitDraft?: OnCommitWriterDraft
): WriterDraftSlice {
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
    onCommitDraft: onCommitDraft
      ? async (draft, deltas) => onCommitDraft(draft, deltas)
      : undefined,
  });
}
