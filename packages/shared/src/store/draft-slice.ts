import type { StateCreator } from 'zustand';

import { applyDeltaToGraph, calculateDelta } from '@magicborn/shared/lib/draft/draft-helpers';

export type DraftSliceState<TGraph, TDelta, TValidation> = {
  committedGraph: TGraph | null;
  draftGraph: TGraph | null;
  deltas: TDelta[];
  validation: TValidation | null;
  hasUncommittedChanges: boolean;
  lastCommittedAt: Date | null;
};

export type DraftSliceActions<TGraph, TDelta> = {
  applyDelta: (delta: TDelta) => void;
  commitDraft: () => Promise<void>;
  discardDraft: () => Promise<void>;
  resetDraft: (nextCommitted?: TGraph | null) => void;
  getDraftGraph: () => TGraph | null;
  getCommittedGraph: () => TGraph | null;
};

export type DraftSliceConfig<TGraph, TDelta, TValidation> = {
  initialGraph?: TGraph | null;
  calculateDelta?: (committed: TGraph, draft: TGraph) => TDelta;
  applyDeltaToGraph?: (graph: TGraph, delta: TDelta) => TGraph;
  validateDraft?: (draft: TGraph) => TValidation | null;
  onCommitDraft?: (draft: TGraph, deltas: TDelta[], committed: TGraph) => Promise<TGraph | void> | TGraph | void;
  onDiscardDraft?: (draft: TGraph, committed: TGraph, deltas: TDelta[]) => Promise<TGraph | void> | TGraph | void;
};

export type DraftSlice<TGraph, TDelta, TValidation> = DraftSliceState<TGraph, TDelta, TValidation> &
  DraftSliceActions<TGraph, TDelta>;

export const createDraftSlice = <
  TState extends DraftSlice<TGraph, TDelta, TValidation>,
  TGraph,
  TDelta = ReturnType<typeof calculateDelta>,
  TValidation = unknown,
>(
  set: Parameters<StateCreator<TState, [], [], TState>>[0],
  get: Parameters<StateCreator<TState, [], [], TState>>[1],
  config: DraftSliceConfig<TGraph, TDelta, TValidation> = {}
): DraftSlice<TGraph, TDelta, TValidation> => {
  const defaultCalculateDelta = calculateDelta as unknown as (committed: TGraph, draft: TGraph) => TDelta;
  const defaultApplyDeltaToGraph = applyDeltaToGraph as unknown as (graph: TGraph, delta: TDelta) => TGraph;
  const calculateDeltaFn = config.calculateDelta ?? defaultCalculateDelta;
  const applyDeltaToGraphFn = config.applyDeltaToGraph ?? defaultApplyDeltaToGraph;

  const initialGraph = config.initialGraph ?? null;
  const initialValidation = initialGraph ? (config.validateDraft?.(initialGraph) ?? null) : null;

  return {
    committedGraph: initialGraph,
    draftGraph: initialGraph,
    deltas: [],
    validation: initialValidation,
    hasUncommittedChanges: false,
    lastCommittedAt: null,

    applyDelta: (delta: TDelta) => {
      set((state) => {
        if (!state.draftGraph || !state.committedGraph) {
          return state;
        }

        const nextDraft = applyDeltaToGraphFn(state.draftGraph, delta);
        const nextDelta = calculateDeltaFn(state.committedGraph, nextDraft);
        const nextValidation = config.validateDraft?.(nextDraft) ?? state.validation;

        return {
          draftGraph: nextDraft,
          deltas: [...state.deltas, nextDelta],
          validation: nextValidation,
          hasUncommittedChanges: true,
        } as unknown as Partial<TState>;
      });
    },

    commitDraft: async () => {
      const { draftGraph, committedGraph, deltas } = get();
      if (!draftGraph || !committedGraph) {
        return;
      }

      const result = await config.onCommitDraft?.(draftGraph, deltas, committedGraph);
      const nextCommitted = (result ?? draftGraph) as TGraph;
      const nextValidation = config.validateDraft?.(nextCommitted) ?? null;

      set({
        committedGraph: nextCommitted,
        draftGraph: nextCommitted,
        deltas: [],
        validation: nextValidation,
        hasUncommittedChanges: false,
        lastCommittedAt: new Date(),
      } as unknown as Partial<TState>);
    },

    discardDraft: async () => {
      const { draftGraph, committedGraph, deltas } = get();
      if (!draftGraph || !committedGraph) {
        return;
      }

      const result = await config.onDiscardDraft?.(draftGraph, committedGraph, deltas);
      const nextGraph = (result ?? committedGraph) as TGraph;
      const nextValidation = config.validateDraft?.(nextGraph) ?? null;

      set({
        committedGraph: nextGraph,
        draftGraph: nextGraph,
        deltas: [],
        validation: nextValidation,
        hasUncommittedChanges: false,
      } as unknown as Partial<TState>);
    },

    resetDraft: (nextCommitted?: TGraph | null) => {
      set((state) => {
        const committed = nextCommitted ?? state.committedGraph ?? null;
        const nextValidation = committed ? (config.validateDraft?.(committed) ?? null) : null;

        return {
          committedGraph: committed,
          draftGraph: committed,
          deltas: [],
          validation: nextValidation,
          hasUncommittedChanges: false,
        } as unknown as Partial<TState>;
      });
    },

    getDraftGraph: () => get().draftGraph,
    getCommittedGraph: () => get().committedGraph,
  };
};
