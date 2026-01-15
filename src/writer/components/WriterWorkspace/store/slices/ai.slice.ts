import type { StateCreator } from 'zustand';
import type {
  WriterDocSnapshot,
  WriterPatchOp,
  WriterSelectionSnapshot,
} from '@/writer/types/writer-ai-types';
import type { WriterWorkspaceState, WriterAiPreviewMeta, WriterAiProposalStatus } from '../writer-workspace-types';
import { WRITER_AI_PROPOSAL_STATUS } from '../writer-workspace-types';
import { applyWriterPatchOps } from '@/writer/lib/editor/patches';

const createSnapshotFromPage = (
  page: { title: string; bookBody?: string | null },
  draft?: { title: string; content: string }
): WriterDocSnapshot => ({
  title: draft?.title ?? page.title,
  content: draft?.content ?? page.bookBody ?? '',
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
  proposeAiEdits: () => Promise<void>;
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
    proposeAiEdits: async () => {
      const state = get();
      const targetId = state.activePageId;
      if (!targetId) {
        return;
      }
      const page = state.pages.find((entry) => entry.id === targetId);
      if (!page) {
        return;
      }
      const draft = state.drafts[targetId] ?? {
        title: page.title,
        content: page.bookBody ?? '',
        status: 'saved' as const,
        error: null,
        revision: 0,
      };
      const snapshot = state.aiSnapshot ?? createSnapshotFromPage(page, draft);

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
      const page = state.pages.find((entry) => entry.id === targetId);
      if (!page) {
        return;
      }
      const draft = state.drafts[targetId] ?? {
        title: page.title,
        content: page.bookBody ?? '',
        status: 'saved' as const,
        error: null,
        revision: 0,
      };
      const snapshot = state.aiSnapshot ?? createSnapshotFromPage(page, draft);
      const nextSnapshot = applyWriterPatchOps(snapshot, state.aiPreview);

      set({
        aiPreview: null,
        aiPreviewMeta: null,
        aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
        aiError: null,
        aiSnapshot: nextSnapshot,
        aiUndoSnapshot: snapshot,
      });

      get().actions.setDraftContent(targetId, nextSnapshot.content ?? '');
      if (typeof nextSnapshot.title === 'string') {
        get().actions.setDraftTitle(targetId, nextSnapshot.title);
      }
    },
    revertAiDraft: () => {
      const state = get();
      const targetId = state.activePageId;
      const undoSnapshot = state.aiUndoSnapshot;
      if (!targetId || !undoSnapshot) {
        return;
      }

      set({
        aiUndoSnapshot: null,
        aiSnapshot: undoSnapshot,
        aiPreview: null,
        aiPreviewMeta: null,
        aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
        aiError: null,
      });

      get().actions.setDraftContent(targetId, undoSnapshot.content ?? '');
      if (typeof undoSnapshot.title === 'string') {
        get().actions.setDraftTitle(targetId, undoSnapshot.title);
      }
    },
  };
}
