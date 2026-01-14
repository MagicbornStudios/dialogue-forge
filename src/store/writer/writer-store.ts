'use client';

import { createStore } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';
import type { WriterDataAdapter } from '@/src/lib/writer/data-adapter/writer-adapter';
import {
  WRITER_DOC_KIND,
  type DocRef,
  type WriterActDoc,
  type WriterChapterDoc,
  type WriterDocMaps,
  type WriterPageDoc,
  type WriterTreeDto,
} from './writer-types';
import {
  applyWriterPatchOps,
  type WriterDocSnapshot,
  type WriterPatchOp,
  type WriterSelectionRange,
} from './writer-patches';

export const WRITER_SAVE_STATUS = {
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
} as const;

export type WriterSaveStatus =
  (typeof WRITER_SAVE_STATUS)[keyof typeof WRITER_SAVE_STATUS];

export type WriterDraftState = {
  title: string;
  content: string | null;
  status: WriterSaveStatus;
  error: string | null;
  revision: number;
};

export const WRITER_AI_PROPOSAL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type WriterAiProposalStatus =
  (typeof WRITER_AI_PROPOSAL_STATUS)[keyof typeof WRITER_AI_PROPOSAL_STATUS];

export interface WriterStoreState {
  projectId: number | null;
  docs: WriterDocMaps;
  tree: WriterTreeDto;
  activeDoc: DocRef | null;
  drafts: Record<string, WriterDraftState>;
  aiPreview: WriterPatchOp[] | null;
  aiProposalStatus: WriterAiProposalStatus;
  aiError: string | null;
  aiSelection: WriterSelectionRange | null;
  aiSnapshot: WriterDocSnapshot | null;
  dataAdapter?: WriterDataAdapter;
  actions: {
    loadProject: (projectId: number) => Promise<void>;
    openDoc: (ref: DocRef) => void;
    setDraftTitle: (title: string) => void;
    setDraftContent: (content: string | null) => void;
    saveNow: (ref?: DocRef) => Promise<void>;
    scheduleAutosave: (ref?: DocRef) => void;
    setAiSelection: (selection: WriterSelectionRange | null) => void;
    setAiSnapshot: (snapshot: WriterDocSnapshot | null) => void;
    proposeAiEdits: () => Promise<void>;
    applyAiEdits: () => void;
  };
}

export interface CreateWriterStoreOptions {
  dataAdapter?: WriterDataAdapter;
  autosaveDelayMs?: number;
}

const EMPTY_DOCS: WriterDocMaps = {
  acts: {},
  chapters: {},
  pages: {},
};

const DEFAULT_AUTOSAVE_DELAY_MS = 1000;

const toDocKey = (ref: DocRef) => `${ref.kind}:${ref.id}`;

const createDraftFromDoc = (doc: WriterActDoc | WriterChapterDoc | WriterPageDoc): WriterDraftState => ({
  title: doc.title,
  content: doc.bookBody ?? null,
  status: WRITER_SAVE_STATUS.SAVED,
  error: null,
  revision: 0,
});

const buildTree = (
  acts: WriterActDoc[],
  chapters: WriterChapterDoc[],
  pages: WriterPageDoc[]
): WriterTreeDto => {
  const chaptersByAct = new Map<number, WriterChapterDoc[]>();
  const pagesByChapter = new Map<number, WriterPageDoc[]>();

  chapters.forEach((chapter) => {
    const list = chaptersByAct.get(chapter.act) ?? [];
    list.push(chapter);
    chaptersByAct.set(chapter.act, list);
  });

  pages.forEach((page) => {
    const list = pagesByChapter.get(page.chapter) ?? [];
    list.push(page);
    pagesByChapter.set(page.chapter, list);
  });

  return [...acts]
    .sort((left, right) => left.order - right.order)
    .map((act) => ({
      id: act.id,
      title: act.title,
      order: act.order,
      chapters: (chaptersByAct.get(act.id) ?? [])
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.order,
          actId: act.id,
          pages: (pagesByChapter.get(chapter.id) ?? [])
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((page) => ({
              id: page.id,
              title: page.title,
              order: page.order,
              chapterId: chapter.id,
            })),
        })),
    }));
};

const getDocFromState = (docs: WriterDocMaps, ref: DocRef) => {
  switch (ref.kind) {
    case WRITER_DOC_KIND.ACT:
      return docs.acts[ref.id];
    case WRITER_DOC_KIND.CHAPTER:
      return docs.chapters[ref.id];
    case WRITER_DOC_KIND.PAGE:
      return docs.pages[ref.id];
    default:
      return undefined;
  }
};

const updateDocInState = (
  docs: WriterDocMaps,
  ref: DocRef,
  nextDoc: WriterActDoc | WriterChapterDoc | WriterPageDoc
) => {
  switch (ref.kind) {
    case WRITER_DOC_KIND.ACT:
      return { ...docs, acts: { ...docs.acts, [nextDoc.id]: nextDoc } };
    case WRITER_DOC_KIND.CHAPTER:
      return { ...docs, chapters: { ...docs.chapters, [nextDoc.id]: nextDoc } };
    case WRITER_DOC_KIND.PAGE:
      return { ...docs, pages: { ...docs.pages, [nextDoc.id]: nextDoc } };
    default:
      return docs;
  }
};

const getDocPatch = (draft: WriterDraftState) => ({
  title: draft.title,
  bookBody: draft.content ?? null,
});

export function createWriterStore(options: CreateWriterStoreOptions = {}) {
  const { dataAdapter, autosaveDelayMs = DEFAULT_AUTOSAVE_DELAY_MS } = options;
  const autosaveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const saveRequestIds = new Map<string, number>();

  return createStore<WriterStoreState>()(
    devtools(
      (set, get) => ({
        projectId: null,
        docs: EMPTY_DOCS,
        tree: [],
        activeDoc: null,
        drafts: {},
        aiPreview: null,
        aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
        aiError: null,
        aiSelection: null,
        aiSnapshot: null,
        dataAdapter,
        actions: {
          loadProject: async (projectId: number) => {
            const adapter = get().dataAdapter;
            if (!adapter) {
              throw new Error('Writer store has no data adapter configured.');
            }

            const [acts, chapters, pages] = await Promise.all([
              adapter.listActs(projectId),
              adapter.listChapters(projectId),
              adapter.listPages(projectId),
            ]);

            const nextDocs: WriterDocMaps = {
              acts: Object.fromEntries(acts.map((act) => [act.id, act])),
              chapters: Object.fromEntries(
                chapters.map((chapter) => [chapter.id, chapter])
              ),
              pages: Object.fromEntries(pages.map((page) => [page.id, page])),
            };

            set({
              projectId,
              docs: nextDocs,
              tree: buildTree(acts, chapters, pages),
              activeDoc: null,
              drafts: {},
              aiPreview: null,
              aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
              aiError: null,
              aiSelection: null,
              aiSnapshot: null,
            });
          },
          openDoc: (ref: DocRef) => {
            const state = get();
            const doc = getDocFromState(state.docs, ref);
            if (!doc) {
              return;
            }
            const key = toDocKey(ref);
            set({
              activeDoc: ref,
              drafts: {
                ...state.drafts,
                [key]: state.drafts[key] ?? createDraftFromDoc(doc),
              },
              aiPreview: null,
              aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
              aiError: null,
            });
          },
          setDraftTitle: (title: string) => {
            const state = get();
            if (!state.activeDoc) {
              return;
            }
            const doc = getDocFromState(state.docs, state.activeDoc);
            if (!doc) {
              return;
            }
            const key = toDocKey(state.activeDoc);
            const draft = state.drafts[key] ?? createDraftFromDoc(doc);
            set({
              drafts: {
                ...state.drafts,
                [key]: {
                  ...draft,
                  title,
                  status: WRITER_SAVE_STATUS.DIRTY,
                  error: null,
                  revision: draft.revision + 1,
                },
              },
            });
          },
          setDraftContent: (content: string | null) => {
            const state = get();
            if (!state.activeDoc) {
              return;
            }
            const doc = getDocFromState(state.docs, state.activeDoc);
            if (!doc) {
              return;
            }
            const key = toDocKey(state.activeDoc);
            const draft = state.drafts[key] ?? createDraftFromDoc(doc);
            set({
              drafts: {
                ...state.drafts,
                [key]: {
                  ...draft,
                  content,
                  status: WRITER_SAVE_STATUS.DIRTY,
                  error: null,
                  revision: draft.revision + 1,
                },
              },
            });
          },
          saveNow: async (ref?: DocRef) => {
            const state = get();
            const target = ref ?? state.activeDoc;
            if (!target) {
              return;
            }
            const adapter = state.dataAdapter;
            if (!adapter) {
              throw new Error('Writer store has no data adapter configured.');
            }
            const key = toDocKey(target);
            const draft = state.drafts[key];
            if (!draft) {
              return;
            }
            if (draft.status === WRITER_SAVE_STATUS.SAVING) {
              return;
            }
            const requestId = (saveRequestIds.get(key) ?? 0) + 1;
            saveRequestIds.set(key, requestId);
            const saveRevision = draft.revision;

            set({
              drafts: {
                ...state.drafts,
                [key]: {
                  ...draft,
                  status: WRITER_SAVE_STATUS.SAVING,
                  error: null,
                },
              },
            });

            try {
              const patch = getDocPatch(draft);
              let savedDoc: WriterActDoc | WriterChapterDoc | WriterPageDoc;

              switch (target.kind) {
                case WRITER_DOC_KIND.ACT:
                  savedDoc = await adapter.updateAct(target.id, patch);
                  break;
                case WRITER_DOC_KIND.CHAPTER:
                  savedDoc = await adapter.updateChapter(target.id, patch);
                  break;
                case WRITER_DOC_KIND.PAGE:
                  savedDoc = await adapter.updatePage(target.id, patch);
                  break;
                default:
                  return;
              }

              if (saveRequestIds.get(key) !== requestId) {
                return;
              }

              set((current) => {
                const nextDocs = updateDocInState(current.docs, target, savedDoc);
                const currentDraft = current.drafts[key];
                if (!currentDraft) {
                  return { docs: nextDocs };
                }
                const nextDraft: WriterDraftState =
                  currentDraft.revision === saveRevision
                    ? {
                        ...currentDraft,
                        title: savedDoc.title,
                        content: savedDoc.bookBody ?? null,
                        status: WRITER_SAVE_STATUS.SAVED,
                        error: null,
                      }
                    : {
                        ...currentDraft,
                        status: WRITER_SAVE_STATUS.DIRTY,
                        error: null,
                      };
                return {
                  docs: nextDocs,
                  drafts: { ...current.drafts, [key]: nextDraft },
                };
              });
            } catch (error) {
              if (saveRequestIds.get(key) !== requestId) {
                return;
              }
              const message =
                error instanceof Error
                  ? error.message
                  : 'Unable to save document.';
              set((current) => {
                const currentDraft = current.drafts[key];
                if (!currentDraft) {
                  return {};
                }
                return {
                  drafts: {
                    ...current.drafts,
                    [key]: {
                      ...currentDraft,
                      status: WRITER_SAVE_STATUS.ERROR,
                      error: message,
                    },
                  },
                };
              });
            }
          },
          scheduleAutosave: (ref?: DocRef) => {
            const target = ref ?? get().activeDoc;
            if (!target) {
              return;
            }
            const key = toDocKey(target);
            const existingTimer = autosaveTimers.get(key);
            if (existingTimer) {
              clearTimeout(existingTimer);
            }
            const timer = setTimeout(() => {
              autosaveTimers.delete(key);
              void get().actions.saveNow(target);
            }, autosaveDelayMs);
            autosaveTimers.set(key, timer);
          },
          setAiSelection: (selection) => {
            set({ aiSelection: selection });
          },
          setAiSnapshot: (snapshot) => {
            set({ aiSnapshot: snapshot });
          },
          proposeAiEdits: async () => {
            const state = get();
            const target = state.activeDoc;
            if (!target) {
              return;
            }
            const doc = getDocFromState(state.docs, target);
            if (!doc) {
              return;
            }
            const key = toDocKey(target);
            const draft = state.drafts[key] ?? createDraftFromDoc(doc);
            const snapshot: WriterDocSnapshot = state.aiSnapshot ?? {
              content: draft.content,
              blocks: null,
            };

            set({
              aiPreview: null,
              aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.LOADING,
              aiError: null,
              aiSnapshot: snapshot,
            });

            try {
              const response = await fetch('/api/ai/writer/edits:propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId: state.projectId,
                  doc: target,
                  selection: state.aiSelection,
                  snapshot,
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                  errorText || 'Unable to propose AI edits for this document.'
                );
              }

              const data: unknown = await response.json();
              const ops = Array.isArray((data as { ops?: unknown }).ops)
                ? ((data as { ops: WriterPatchOp[] }).ops ?? [])
                : Array.isArray(data)
                  ? (data as WriterPatchOp[])
                  : [];

              set({
                aiPreview: ops,
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
                aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.ERROR,
                aiError: message,
              });
            }
          },
          applyAiEdits: () => {
            const state = get();
            const target = state.activeDoc;
            if (!target || !state.aiPreview || state.aiPreview.length === 0) {
              return;
            }
            const doc = getDocFromState(state.docs, target);
            if (!doc) {
              return;
            }
            const key = toDocKey(target);
            const draft = state.drafts[key] ?? createDraftFromDoc(doc);
            const snapshot: WriterDocSnapshot = state.aiSnapshot ?? {
              content: draft.content,
              blocks: null,
            };
            const nextSnapshot = applyWriterPatchOps(
              snapshot,
              state.aiPreview
            );

            set({
              aiPreview: null,
              aiProposalStatus: WRITER_AI_PROPOSAL_STATUS.IDLE,
              aiError: null,
              aiSnapshot: nextSnapshot,
            });

            get().actions.setDraftContent(nextSnapshot.content);
            get().actions.scheduleAutosave(target);
          },
        },
      }),
      { name: 'WriterStore' }
    )
  );
}

export type WriterStore = ReturnType<typeof createWriterStore>;
