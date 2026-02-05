'use client';

import { useMemo } from 'react';
import type { WriterDataAdapter, WriterPageDoc, WriterComment, WriterThread } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import type { Page } from '../../payload-types';
import { PAYLOAD_COLLECTIONS } from '../../payload-collections/enums';
import type { Comment, Thread } from '@magicborn/writer/components/WriterWorkspace/editor/lexical/commenting';
import { payload } from '../forge/payload';

const normalizeBookBody = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

function mapPage(doc: Page & { narrativeGraph?: number | { id: number } | null }): WriterPageDoc {
  const dialogueGraphId = doc.dialogueGraph == null ? null : typeof doc.dialogueGraph === 'number' ? doc.dialogueGraph : doc.dialogueGraph.id;
  const narrativeGraphId = doc.narrativeGraph == null ? null : typeof doc.narrativeGraph === 'number' ? doc.narrativeGraph : doc.narrativeGraph.id;
  const parentId = doc.parent == null ? null : typeof doc.parent === 'number' ? doc.parent : doc.parent.id;
  return {
    id: doc.id,
    pageType: doc.pageType as 'ACT' | 'CHAPTER' | 'PAGE',
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: typeof doc.project === 'number' ? doc.project : doc.project.id,
    parent: parentId,
    narrativeGraph: narrativeGraphId,
    dialogueGraph: dialogueGraphId,
    bookHeading: doc.bookHeading ?? null,
    bookBody: normalizeBookBody(doc.bookBody),
    content: doc.content ?? null,
    archivedAt: doc.archivedAt ?? null,
  };
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function useWriterData(): WriterDataAdapter {
  return useMemo((): WriterDataAdapter => ({
    async listPages(projectId: number, narrativeGraphId?: number | null) {
      const where: Record<string, unknown> = { project: { equals: projectId } };
      if (narrativeGraphId != null) where.narrativeGraph = { equals: narrativeGraphId };
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PAGES, where: where as any, limit: 1000 });
      return sortByOrder(result.docs.map((doc) => mapPage(doc as Page)));
    },
    async getPage(pageId: number) {
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page;
      return mapPage(doc);
    },
    async createPage(input: {
      projectId: number;
      pageType: 'ACT' | 'CHAPTER' | 'PAGE';
      title: string;
      order: number;
      parent?: number | null;
      narrativeGraph?: number | null;
      bookBody?: string | null;
    }) {
      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        data: {
          project: input.projectId,
          pageType: input.pageType,
          title: input.title,
          order: input.order,
          parent: input.parent ?? null,
          narrativeGraph: input.narrativeGraph ?? null,
          bookBody: input.bookBody ?? null,
        } as any,
      })) as Page;
      return mapPage(doc);
    },
    async updatePage(pageId: number, patch: Partial<WriterPageDoc>) {
      const doc = (await payload.update({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId, data: patch as any })) as unknown as Page;
      return mapPage(doc);
    },
    async deletePage(pageId: number) {
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId });
    },
    async listComments(pageId: number) {
      const page = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page & { comments?: Array<WriterComment | WriterThread> };
      if (!page.comments || !Array.isArray(page.comments)) return [];
      return page.comments.map((c) => ({ ...c, pageId }));
    },
    async createComment(pageId: number, input: { author: string; content: string; nodeKey?: string; threadId?: string | null; quote?: string }) {
      const page = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page & { comments?: Array<WriterComment | WriterThread> };
      const existingComments = page.comments || [];
      const id = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 5);
      const timeStamp = typeof performance !== 'undefined' ? performance.timeOrigin + performance.now() : Date.now();
      let newComment: WriterComment | WriterThread;

      if (input.threadId) {
        const threadIndex = existingComments.findIndex((c: WriterComment | WriterThread) => c.type === 'thread' && c.id === input.threadId);
        if (threadIndex >= 0) {
          const thread = existingComments[threadIndex] as WriterThread;
          const updatedThread: WriterThread = {
            ...thread,
            comments: [...thread.comments, { author: input.author, content: input.content, deleted: false, id, timeStamp, type: 'comment' } as Comment],
          };
          existingComments[threadIndex] = updatedThread;
          newComment = updatedThread;
        } else {
          newComment = { author: input.author, content: input.content, deleted: false, id, timeStamp, type: 'comment', pageId, nodeKey: input.nodeKey, threadId: input.threadId } as WriterComment;
          existingComments.push(newComment);
        }
      } else if (input.quote) {
        newComment = {
          id,
          quote: input.quote,
          comments: [{ author: input.author, content: input.content, deleted: false, id: Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 5), timeStamp, type: 'comment' } as Comment],
          type: 'thread',
          pageId,
          nodeKey: input.nodeKey,
        } as WriterThread;
        existingComments.push(newComment);
      } else {
        newComment = { author: input.author, content: input.content, deleted: false, id, timeStamp, type: 'comment', pageId, nodeKey: input.nodeKey } as WriterComment;
        existingComments.push(newComment);
      }

      await payload.update({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId, data: { comments: existingComments } as any });
      return newComment;
    },
    async updateComment(pageId: number, commentId: string, patch: Partial<WriterComment>) {
      const page = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page & { comments?: Array<WriterComment | WriterThread> };
      if (!page) throw new Error(`Page ${pageId} not found`);
      const comments: (WriterComment | WriterThread)[] = page.comments || [];
      let updated = false;
      const updatedComments = comments.map((comment: WriterComment | WriterThread) => {
        if (comment.type === 'comment' && comment.id === commentId) {
          updated = true;
          return { ...comment, ...patch } as WriterComment;
        }
        if (comment.type === 'thread') {
          const thread = comment as WriterThread;
          const updatedThreadComments = thread.comments.map((c) => (c.id === commentId ? { ...c, ...patch } : c));
          if (updatedThreadComments.some((c) => c.id === commentId)) {
            updated = true;
            return { ...thread, comments: updatedThreadComments } as WriterThread;
          }
        }
        return comment;
      });
      if (!updated) throw new Error(`Comment ${commentId} not found`);
      await payload.update({ collection: PAYLOAD_COLLECTIONS.PAGES, id: page.id, data: { comments: updatedComments } as any });
      const found = updatedComments.find((c) => (c.type === 'comment' && c.id === commentId) || (c.type === 'thread' && (c as WriterThread).comments.some((com) => com.id === commentId)));
      if (found?.type === 'thread') {
        const comment = (found as WriterThread).comments.find((c) => c.id === commentId);
        if (comment) return { ...comment, pageId: page.id } as WriterComment;
      }
      return { ...(found as WriterComment), pageId: page.id };
    },
    async deleteComment(pageId: number, commentId: string) {
      const page = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId })) as Page & { comments?: Array<WriterComment | WriterThread> };
      if (!page) throw new Error(`Page ${pageId} not found`);
      const comments: (WriterComment | WriterThread)[] = page.comments || [];
      const updatedComments = comments
        .map((comment: WriterComment | WriterThread) => {
          if (comment.type === 'comment' && comment.id === commentId) {
            return { ...comment, deleted: true, content: '[Deleted Comment]' } as WriterComment;
          }
          if (comment.type === 'thread') {
            const thread = comment as WriterThread;
            if (thread.id === commentId) return null;
            const hasComment = thread.comments.some((c) => c.id === commentId);
            if (hasComment) {
              return { ...thread, comments: thread.comments.map((c) => (c.id === commentId ? { ...c, deleted: true, content: '[Deleted Comment]' } : c)) } as WriterThread;
            }
          }
          return comment;
        })
        .filter((c): c is WriterComment | WriterThread => c !== null);
      await payload.update({ collection: PAYLOAD_COLLECTIONS.PAGES, id: pageId, data: { comments: updatedComments } as any });
    },
  }), []);
}
