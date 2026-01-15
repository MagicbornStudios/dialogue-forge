import { PayloadSDK } from '@payloadcms/sdk';
import type { WriterDataAdapter, WriterActDoc, WriterChapterDoc, WriterPageDoc } from '@/writer/lib/data-adapter/writer-adapter';
import type { Act, Chapter, Page } from '@/app/payload-types';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';

function mapAct(doc: Act): WriterActDoc {
  return {
    id: doc.id,
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: typeof doc.project === 'number' ? doc.project : doc.project.id,
    bookHeading: doc.bookHeading ?? null,
    bookBody: doc.bookBody ?? null,
    _status: doc._status as 'draft' | 'published' | null,
  };
}

function mapChapter(doc: Chapter): WriterChapterDoc {
  return {
    id: doc.id,
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: typeof doc.project === 'number' ? doc.project : doc.project.id,
    act: typeof doc.act === 'number' ? doc.act : doc.act.id,
    bookHeading: doc.bookHeading ?? null,
    bookBody: doc.bookBody ?? null,
    _status: doc._status as 'draft' | 'published' | null,
  };
}

function mapPage(doc: Page): WriterPageDoc {
  return {
    id: doc.id,
    title: doc.title,
    summary: doc.summary ?? null,
    order: doc.order,
    project: typeof doc.project === 'number' ? doc.project : doc.project.id,
    chapter: typeof doc.chapter === 'number' ? doc.chapter : doc.chapter.id,
    dialogueGraph: typeof doc.dialogueGraph === 'number' ? doc.dialogueGraph : doc.dialogueGraph?.id ?? null,
    bookBody: doc.bookBody ?? null,
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
    async listActs(projectId: number): Promise<WriterActDoc[]> {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.ACTS,
        where: {
          project: {
            equals: projectId,
          },
        },
        limit: 200,
      });
      const acts = result.docs.map((doc) => mapAct(doc as Act));
      return sortByOrder(acts);
    },

    async listChapters(projectId: number, actId?: number): Promise<WriterChapterDoc[]> {
      const where: Record<string, unknown> = {
        project: {
          equals: projectId,
        },
      };

      if (actId) {
        where.act = {
          equals: actId,
        };
      }

      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.CHAPTERS,
        where: where as any,
        limit: 200,
      });
      const chapters = result.docs.map((doc) => mapChapter(doc as Chapter));
      return sortByOrder(chapters);
    },

    async listPages(projectId: number, chapterId?: number): Promise<WriterPageDoc[]> {
      const where: Record<string, unknown> = {
        project: {
          equals: projectId,
        },
      };

      if (chapterId) {
        where.chapter = {
          equals: chapterId,
        };
      }

      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        where: where as any,
        limit: 200,
      });
      const pages = result.docs.map((doc) => mapPage(doc as Page));
      return sortByOrder(pages);
    },

    async getAct(actId: number): Promise<WriterActDoc> {
      const doc = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.ACTS,
        id: actId,
      }) as Act;
      return mapAct(doc);
    },

    async getChapter(chapterId: number): Promise<WriterChapterDoc> {
      const doc = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.CHAPTERS,
        id: chapterId,
      }) as Chapter;
      return mapChapter(doc);
    },

    async getPage(pageId: number): Promise<WriterPageDoc> {
      const doc = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
      }) as Page;
      return mapPage(doc);
    },

    async updateAct(actId: number, patch: Partial<WriterActDoc>): Promise<WriterActDoc> {
      const doc = await payload.update({
        collection: PAYLOAD_COLLECTIONS.ACTS,
        id: actId,
        data: patch,
      }) as Act;
      return mapAct(doc);
    },

    async updateChapter(chapterId: number, patch: Partial<WriterChapterDoc>): Promise<WriterChapterDoc> {
      const doc = await payload.update({
        collection: PAYLOAD_COLLECTIONS.CHAPTERS,
        id: chapterId,
        data: patch,
      }) as Chapter;
      return mapChapter(doc);
    },

    async updatePage(pageId: number, patch: Partial<WriterPageDoc>): Promise<WriterPageDoc> {
      const doc = await payload.update({
        collection: PAYLOAD_COLLECTIONS.PAGES,
        id: pageId,
        data: patch,
      }) as Page;
      return mapPage(doc);
    },
  };
}
