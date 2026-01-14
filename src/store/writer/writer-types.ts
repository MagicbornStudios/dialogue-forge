import type { ForgeAct, ForgeChapter, ForgePage } from '@/src/types/narrative';

export const WRITER_DOC_KIND = {
  ACT: 'act',
  CHAPTER: 'chapter',
  PAGE: 'page',
} as const;

export type WriterDocKind = (typeof WRITER_DOC_KIND)[keyof typeof WRITER_DOC_KIND];

export type WriterActDoc = ForgeAct;
export type WriterChapterDoc = ForgeChapter;
export type WriterPageDoc = ForgePage;
export type WriterDoc = WriterActDoc | WriterChapterDoc | WriterPageDoc;

export type DocRef = {
  kind: WriterDocKind;
  id: number;
};

export type WriterDocMap<T extends WriterDoc> = Record<number, T>;

export type WriterDocMaps = {
  acts: WriterDocMap<WriterActDoc>;
  chapters: WriterDocMap<WriterChapterDoc>;
  pages: WriterDocMap<WriterPageDoc>;
};

export type WriterPageTreeDto = {
  id: number;
  title: string;
  order: number;
  chapterId: number;
};

export type WriterChapterTreeDto = {
  id: number;
  title: string;
  order: number;
  actId: number;
  pages: WriterPageTreeDto[];
};

export type WriterActTreeDto = {
  id: number;
  title: string;
  order: number;
  chapters: WriterChapterTreeDto[];
};

export type WriterTreeDto = WriterActTreeDto[];
