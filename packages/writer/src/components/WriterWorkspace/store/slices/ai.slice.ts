import type { StateCreator } from 'zustand';
import type {
  WriterDocSnapshot,
  WriterPatchOp,
  WriterSelectionSnapshot,
} from '@magicborn/writer/types/writer-ai-types';
import type {
  WriterWorkspaceState,
  WriterAiPreviewMeta,
  WriterAiProposalStatus,
} from '../writer-workspace-types';
import { getPlainTextFromSerializedContent, WRITER_AI_PROPOSAL_STATUS } from '../writer-workspace-types';
import { applyWriterPatchOps } from '@magicborn/writer/lib/editor/patches';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';

const createSnapshotFromPage = (page: { title: string; bookBody?: string | null }): WriterDocSnapshot => ({
  title: page.title,
  content: getPlainTextFromSerializedContent(page.bookBody),
});

export interface AiSlice {
  aiPreview: WriterPatchOp[] | null;
  aiPreviewMeta: WriterAiPreviewMeta | null;
  aiProposalStatus: WriterAiProposalStatus;
  aiError: string | null;
  aiSelection: WriterSelectionSnapshot | null;
  aiSnapshot: WriterDocSnapshot | null;
  aiUndoSnapshot: WriterDocSnapshot | null;
}

export interface AiActions {
  setAiSelection: (selection: WriterSelectionSnapshot | null) => void;
  proposeAiEdits: (instruction?: string) => Promise<void>;
  applyAiEdits: () => void;
  revertAiDraft: () => void;
}

export function createAiSlice(
  set: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[0],
  get: Parameters<StateCreator<WriterWorkspaceState, [], [], WriterWorkspaceState>>[1]
): AiSlice & AiActions {
  return {
    aiPreview: null,
    aiPreviewMeta: null,
    aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
    aiError: null,
    aiSelection: null,
    aiSnapshot: null,
    aiUndoSnapshot: null,
    setAiSelection: (selection) => set({ aiSelection: selection }),
    proposeAiEdits: async (instruction?: string) => {
      const state = get();
      const targetId = state.activePageId;
      if (!targetId) {
        return;
      }
      const page = state.pageMap.get(targetId);
      if (!page) {
        return;
      }
      const snapshot = state.aiSnapshot ?? createSnapshotFromPage(page);

      set({
        aiPreview: null,
        aiPreviewMeta: null,
        aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.LOADING,
        aiError: null,
        aiSnapshot: snapshot,
        aiUndoSnapshot: null,
      });

      try {
        const response = await fetch('/api/ai/writer/edits/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: targetId,
            selection: state.aiSelection,
            snapshot,
            instruction,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            errorText || 'Unable to propose AI edits for this page.'
          );
        }

        const data: unknown = await response.json();
        const parsed = data as {
          ok: boolean;
          data?: {
            patch?: string;
            summary?: string;
          };
          error?: {
            message?: string;
          };
        };

        if (!parsed.ok) {
          throw new Error(
            parsed.error?.message || 'Unable to propose AI edits for this page.'
          );
        }

        const patchRaw = parsed.data?.patch;
        if (!patchRaw) {
          throw new Error('AI edit proposal missing patch data.');
        }

        const ops = JSON.parse(patchRaw) as WriterPatchOp[];
        if (!Array.isArray(ops)) {
          throw new Error('AI edit proposal patch is invalid.');
        }

        set({
          aiPreview: ops,
          aiPreviewMeta: {
            summary: parsed.data?.summary ?? 'AI rewrite preview',
            rationale:
              'Suggested edits to improve clarity and flow while preserving intent.',
            risk:
              'Review to ensure names, tone, and facts remain accurate.',
          },
          aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.READY,
          aiError: null,
          aiSnapshot: snapshot,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to propose AI edits.';
        set({
          aiPreview: null,
          aiPreviewMeta: null,
          aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.ERROR,
          aiError: message,
        });
      }
    },
    applyAiEdits: () => {
      const state = get();
      const targetId = state.activePageId;
      if (!targetId || !state.aiPreview || state.aiPreview.length === 0) {
        return;
      }
      const page = state.pageMap.get(targetId);
      if (!page) {
        return;
      }
      const snapshot = (state.aiSnapshot as WriterDocSnapshot | null | undefined) ?? createSnapshotFromPage(page);
      const aiPreview = (state.aiPreview as WriterPatchOp[] | null | undefined) ?? [];
      const nextSnapshot = applyWriterPatchOps(snapshot, aiPreview) as WriterDocSnapshot;

      set({
        aiPreview: null,
        aiPreviewMeta: null,
        aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
        aiError: null,
        aiSnapshot: nextSnapshot,
        aiUndoSnapshot: snapshot,
      });

      const nextSnapshotTyped: WriterDocSnapshot = nextSnapshot as WriterDocSnapshot;
      const nextPages = state.pages.map((p) =>
        p.id === targetId
          ? { ...p, title: nextSnapshotTyped.title ?? p.title, bookBody: nextSnapshotTyped.content ?? p.bookBody }
          : p
      );
      const nextPageMap = new Map(state.pageMap);
      nextPageMap.set(targetId, { ...page, title: nextSnapshotTyped.title ?? page.title, bookBody: nextSnapshotTyped.content ?? page.bookBody });
      set({ pages: nextPages, pageMap: nextPageMap });
      const dataAdapter = state.dataAdapter as WriterDataAdapter | undefined;
      dataAdapter
        ?.updatePage(targetId, {
          title: nextSnapshotTyped.title ?? undefined,
          bookBody: nextSnapshotTyped.content ?? undefined,
        })
        .catch(console.error);
    },
    revertAiDraft: () => {
      const state = get();
      const targetId = state.activePageId;
      const undoSnapshot = state.aiUndoSnapshot as WriterDocSnapshot | null | undefined;
      if (!targetId || !undoSnapshot) {
        return;
      }
      const page = state.pageMap.get(targetId);
      set({
        aiUndoSnapshot: null,
        aiSnapshot: undoSnapshot,
        aiPreview: null,
        aiPreviewMeta: null,
        aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
        aiError: null,
      });
      if (page) {
        const undoSnapshotTyped: WriterDocSnapshot = undoSnapshot as WriterDocSnapshot;
        const nextPages = state.pages.map((p) =>
          p.id === targetId ? { ...p, title: undoSnapshotTyped.title ?? p.title, bookBody: undoSnapshotTyped.content ?? p.bookBody } : p
        );
        const nextPageMap = new Map(state.pageMap);
        nextPageMap.set(targetId, { ...page, title: undoSnapshotTyped.title ?? page.title, bookBody: undoSnapshotTyped.content ?? page.bookBody });
        set({ pages: nextPages, pageMap: nextPageMap });
        const dataAdapter = state.dataAdapter as WriterDataAdapter | undefined;
        dataAdapter
          ?.updatePage(targetId, {
            title: undoSnapshotTyped.title ?? undefined,
            bookBody: undoSnapshotTyped.content ?? undefined,
          })
          .catch(console.error);
      }
    },
  };
}
