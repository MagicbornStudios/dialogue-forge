'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForgePayloadClient } from '@magicborn/forge';
import type { ForgePage } from '@magicborn/shared/types/narrative';
import type { Comment } from '@magicborn/writer/components/WriterWorkspace/editor/lexical/commenting';
import type {
  WriterComment,
  WriterPageDoc,
  WriterThread,
} from './writer-types';

const PAYLOAD_COLLECTIONS = {
  PAGES: 'pages',
} as const;

type PayloadPage = {
  id: number;
  pageType: string;
  title: string;
  summary?: string | null;
  order: number;
  project: number | { id?: number };
  parent?: number | { id?: number } | null;
  narrativeGraph?: number | { id?: number } | null;
  dialogueGraph?: number | { id?: number } | null;
  bookHeading?: string | null;
  bookBody?: string | Record<string, unknown> | null;
  content?: unknown;
  archivedAt?: string | null;
  comments?: Array<WriterComment | WriterThread>;
};

type QueryClientLike = {
  fetchQuery: <T>(opts: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<T>;
  }) => Promise<T>;
};

const normalizeBookBody = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const extractId = (
  value: number | { id?: number } | null | undefined,
  field: string
): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value.id === 'number') return value.id;
  throw new Error(`Expected numeric id for ${field}`);
};

function mapPage(doc: PayloadPage): WriterPageDoc {
  return {
    id: doc.id,
    pageType: doc.pageType as 'ACT' | 'CHAPTER' | 'PAGE',
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: extractId(doc.project, 'page.project') ?? 0,
    parent: extractId(doc.parent, 'page.parent'),
    narrativeGraph: extractId(doc.narrativeGraph, 'page.narrativeGraph'),
    dialogueGraph: extractId(doc.dialogueGraph, 'page.dialogueGraph'),
    bookHeading: doc.bookHeading ?? null,
    bookBody: normalizeBookBody(doc.bookBody),
    content: doc.content ?? null,
    archivedAt: doc.archivedAt ?? null,
  };
}

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

export const writerQueryKeys = {
  all: ['writer'] as const,
  pages: (projectId: number, narrativeGraphId?: number | null) =>
    [...writerQueryKeys.all, 'pages', projectId, narrativeGraphId ?? 'all'] as const,
  page: (pageId: number) => [...writerQueryKeys.all, 'page', pageId] as const,
  comments: (pageId: number) => [...writerQueryKeys.all, 'comments', pageId] as const,
};

export function useWriterPages(
  projectId: number | null,
  narrativeGraphId?: number | null
) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: writerQueryKeys.pages(projectId ?? 0, narrativeGraphId),
    queryFn: async (): Promise<WriterPageDoc[]> => {
      const where: Record<string, unknown> = {
        project: { equals: projectId },
      };
      if (narrativeGraphId != null) {
        where.narrativeGraph = { equals: narrativeGraphId };
      }
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        where,
        limit: 1000,
      });
      return sortByOrder((result.docs as PayloadPage[]).map(mapPage));
    },
    enabled: projectId != null,
  });
}

export function useWriterPage(pageId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: writerQueryKeys.page(pageId ?? 0),
    queryFn: async (): Promise<WriterPageDoc> => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId!,
      })) as PayloadPage;
      return mapPage(page);
    },
    enabled: pageId != null,
  });
}

export function useWriterComments(pageId: number | null) {
  const payload = useForgePayloadClient();
  return useQuery({
    queryKey: writerQueryKeys.comments(pageId ?? 0),
    queryFn: async (): Promise<Array<WriterComment | WriterThread>> => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId!,
      })) as PayloadPage;
      if (!Array.isArray(page.comments)) return [];
      return page.comments.map((comment) => ({ ...comment, pageId: pageId! }));
    },
    enabled: pageId != null,
  });
}

export async function fetchWriterPages(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  projectId: number,
  narrativeGraphId?: number | null
): Promise<WriterPageDoc[]> {
  return queryClient.fetchQuery({
    queryKey: writerQueryKeys.pages(projectId, narrativeGraphId),
    queryFn: async () => {
      const where: Record<string, unknown> = {
        project: { equals: projectId },
      };
      if (narrativeGraphId != null) {
        where.narrativeGraph = { equals: narrativeGraphId };
      }
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        where,
        limit: 1000,
      });
      return sortByOrder((result.docs as PayloadPage[]).map(mapPage));
    },
  });
}

export async function fetchWriterPage(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  pageId: number
): Promise<WriterPageDoc> {
  return queryClient.fetchQuery({
    queryKey: writerQueryKeys.page(pageId),
    queryFn: async () =>
      mapPage(
        (await payload.findByID({
          collection: PAYLOAD_COLLECTIONS.PAGES,
          id: pageId,
        })) as PayloadPage
      ),
  });
}

export async function fetchWriterComments(
  queryClient: QueryClientLike,
  payload: ReturnType<typeof useForgePayloadClient>,
  pageId: number
): Promise<Array<WriterComment | WriterThread>> {
  return queryClient.fetchQuery({
    queryKey: writerQueryKeys.comments(pageId),
    queryFn: async () => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      })) as PayloadPage;
      if (!Array.isArray(page.comments)) return [];
      return page.comments.map((comment) => ({ ...comment, pageId }));
    },
  });
}

export function useCreateWriterPage() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: number;
      pageType: 'ACT' | 'CHAPTER' | 'PAGE';
      title: string;
      order: number;
      parent?: number | null;
      narrativeGraph?: number | null;
      bookBody?: string | null;
    }) => {
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        data: {
          project: input.projectId,
          pageType: input.pageType,
          title: input.title,
          order: input.order,
          parent: input.parent ?? null,
          narrativeGraph: input.narrativeGraph ?? null,
          bookBody: input.bookBody ?? null,
        },
      })) as PayloadPage;
      return mapPage(created);
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({
        queryKey: writerQueryKeys.pages(page.project, page.narrativeGraph),
      });
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.page(page.id) });
    },
  });
}

export function useUpdateWriterPage() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      patch,
    }: {
      pageId: number;
      patch: Partial<WriterPageDoc>;
    }) => {
      const updated = (await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: patch as unknown as Record<string, unknown>,
      })) as PayloadPage;
      return mapPage(updated);
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({
        queryKey: writerQueryKeys.pages(page.project, page.narrativeGraph),
      });
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.page(page.id) });
    },
  });
}

export function useDeleteWriterPage() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: number) => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      })) as PayloadPage;
      const projectId = extractId(page.project, 'page.project');
      const narrativeGraphId = extractId(page.narrativeGraph, 'page.narrativeGraph');
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      });
      return { pageId, projectId, narrativeGraphId };
    },
    onSuccess: ({ pageId, projectId, narrativeGraphId }) => {
      queryClient.removeQueries({ queryKey: writerQueryKeys.page(pageId) });
      if (projectId != null) {
        queryClient.invalidateQueries({
          queryKey: writerQueryKeys.pages(projectId, narrativeGraphId),
        });
      }
    },
  });
}

export function useCreateWriterComment() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      input,
    }: {
      pageId: number;
      input: {
        author: string;
        content: string;
        nodeKey?: string;
        threadId?: string | null;
        quote?: string;
      };
    }) => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      })) as PayloadPage;
      const existingComments = [...(page.comments ?? [])];
      const id = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 5);
      const timeStamp =
        typeof performance !== 'undefined'
          ? performance.timeOrigin + performance.now()
          : Date.now();

      let newComment: WriterComment | WriterThread;

      if (input.threadId) {
        const threadIndex = existingComments.findIndex(
          (comment) => comment.type === 'thread' && comment.id === input.threadId
        );
        if (threadIndex >= 0) {
          const thread = existingComments[threadIndex] as WriterThread;
          const updatedThread: WriterThread = {
            ...thread,
            comments: [
              ...thread.comments,
              {
                author: input.author,
                content: input.content,
                deleted: false,
                id,
                timeStamp,
                type: 'comment',
              } as Comment,
            ],
          };
          existingComments[threadIndex] = updatedThread;
          newComment = updatedThread;
        } else {
          newComment = {
            author: input.author,
            content: input.content,
            deleted: false,
            id,
            timeStamp,
            type: 'comment',
            pageId,
            nodeKey: input.nodeKey,
            threadId: input.threadId,
          } as WriterComment;
          existingComments.push(newComment);
        }
      } else if (input.quote) {
        newComment = {
          id,
          quote: input.quote,
          comments: [
            {
              author: input.author,
              content: input.content,
              deleted: false,
              id: Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 5),
              timeStamp,
              type: 'comment',
            } as Comment,
          ],
          type: 'thread',
          pageId,
          nodeKey: input.nodeKey,
        } as WriterThread;
        existingComments.push(newComment);
      } else {
        newComment = {
          author: input.author,
          content: input.content,
          deleted: false,
          id,
          timeStamp,
          type: 'comment',
          pageId,
          nodeKey: input.nodeKey,
        } as WriterComment;
        existingComments.push(newComment);
      }

      await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: { comments: existingComments },
      });

      return newComment;
    },
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.comments(pageId) });
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.page(pageId) });
    },
  });
}

export function useUpdateWriterComment() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      commentId,
      patch,
    }: {
      pageId: number;
      commentId: string;
      patch: Partial<WriterComment>;
    }) => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      })) as PayloadPage;
      const comments = [...(page.comments ?? [])];
      let found = false;

      const updatedComments = comments.map((comment) => {
        if (comment.type === 'comment' && comment.id === commentId) {
          found = true;
          return { ...comment, ...patch } as WriterComment;
        }
        if (comment.type === 'thread') {
          const thread = comment as WriterThread;
          const updatedThreadComments = thread.comments.map((threadComment) =>
            threadComment.id === commentId ? { ...threadComment, ...patch } : threadComment
          );
          if (updatedThreadComments.some((threadComment) => threadComment.id === commentId)) {
            found = true;
            return { ...thread, comments: updatedThreadComments } as WriterThread;
          }
        }
        return comment;
      });

      if (!found) throw new Error(`Comment ${commentId} not found`);

      await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: { comments: updatedComments },
      });

      const updated = updatedComments.find(
        (comment) =>
          (comment.type === 'comment' && comment.id === commentId) ||
          (comment.type === 'thread' &&
            (comment as WriterThread).comments.some(
              (threadComment) => threadComment.id === commentId
            ))
      );

      if (updated?.type === 'thread') {
        const threadComment = (updated as WriterThread).comments.find(
          (comment) => comment.id === commentId
        );
        if (threadComment) return { ...threadComment, pageId } as WriterComment;
      }

      return { ...(updated as WriterComment), pageId };
    },
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.comments(pageId) });
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.page(pageId) });
    },
  });
}

export function useDeleteWriterComment() {
  const payload = useForgePayloadClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, commentId }: { pageId: number; commentId: string }) => {
      const page = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      })) as PayloadPage;
      const comments = [...(page.comments ?? [])];
      const updatedComments = comments
        .map((comment) => {
          if (comment.type === 'comment' && comment.id === commentId) {
            return {
              ...comment,
              deleted: true,
              content: '[Deleted Comment]',
            } as WriterComment;
          }
          if (comment.type === 'thread') {
            const thread = comment as WriterThread;
            if (thread.id === commentId) return null;
            const hasComment = thread.comments.some(
              (threadComment) => threadComment.id === commentId
            );
            if (hasComment) {
              return {
                ...thread,
                comments: thread.comments.map((threadComment) =>
                  threadComment.id === commentId
                    ? {
                        ...threadComment,
                        deleted: true,
                        content: '[Deleted Comment]',
                      }
                    : threadComment
                ),
              } as WriterThread;
            }
          }
          return comment;
        })
        .filter((comment): comment is WriterComment | WriterThread => comment !== null);

      await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: { comments: updatedComments },
      });

      return { pageId, commentId };
    },
    onSuccess: ({ pageId }) => {
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.comments(pageId) });
      queryClient.invalidateQueries({ queryKey: writerQueryKeys.page(pageId) });
    },
  });
}
