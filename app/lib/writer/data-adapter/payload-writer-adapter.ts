import { PayloadSDK } from '@payloadcms/sdk';
import type { WriterDataAdapter, WriterPageDoc } from '@/writer/lib/data-adapter/writer-adapter';
import type { Page } from '@/app/payload-types';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';
import { PAGE_TYPE } from '@/forge/types/narrative';

const normalizeBookBody = (value: unknown): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

function mapPage(doc: Page): WriterPageDoc {
  const dialogueGraphValue = doc.dialogueGraph;
  const dialogueGraphId = 
    dialogueGraphValue === null || dialogueGraphValue === undefined
      ? null
      : typeof dialogueGraphValue === 'number'
      ? dialogueGraphValue
      : dialogueGraphValue.id;

  const parentValue = doc.parent;
  const parentId =
    parentValue === null || parentValue === undefined
      ? null
      : typeof parentValue === 'number'
      ? parentValue
      : parentValue.id;

  return {
    id: doc.id,
    pageType: doc.pageType as 'ACT' | 'CHAPTER' | 'PAGE',
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: typeof doc.project === 'number' ? doc.project : doc.project.id,
    parent: parentId,
    dialogueGraph: dialogueGraphId,
    bookHeading: doc.bookHeading ?? null,
    bookBody: normalizeBookBody(doc.bookBody),
    content: doc.content ?? null,
    archivedAt: doc.archivedAt ?? null,
    _status: doc._status as 'draft' | 'published' | null,
  };
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function makePayloadWriterAdapter(opts?: {
  baseUrl?: string;
}): WriterDataAdapter {
  const baseURL = opts?.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const payload = new PayloadSDK({
    baseURL: `${baseURL}/api`,
  });

  return {
    async listPages(projectId: number): Promise<WriterPageDoc[]> {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        where: {
          project: {
            equals: projectId,
          },
        },
        limit: 1000,
      });
      const pages = result.docs.map((doc) => mapPage(doc as Page));
      return sortByOrder(pages);
    },

    async getPage(pageId: number): Promise<WriterPageDoc> {
      const doc = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      }) as Page;
      return mapPage(doc);
    },

    async createPage(input: {
      projectId: number;
      pageType: 'ACT' | 'CHAPTER' | 'PAGE';
      title: string;
      order: number;
      parent?: number | null;
      bookBody?: string | null;
    }): Promise<WriterPageDoc> {
      const doc = await payload.create({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        data: {
          project: input.projectId,
          pageType: input.pageType,
          title: input.title,
          order: input.order,
          parent: input.parent ?? null,
          bookBody: input.bookBody ?? null,
          _status: 'draft',
        },
      }) as Page;
      return mapPage(doc);
    },

    async updatePage(pageId: number, patch: Partial<WriterPageDoc>): Promise<WriterPageDoc> {
      const doc = await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: patch,
      }) as Page;
      return mapPage(doc);
    },

    async deletePage(pageId: number): Promise<void> {
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      });
    },
  };
}
