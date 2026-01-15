import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';

export type WriterActDoc = ForgeAct;
export type WriterChapterDoc = ForgeChapter;
export type WriterPageDoc = ForgePage;
export type WriterDoc = WriterActDoc | WriterChapterDoc | WriterPageDoc;

export interface WriterDataAdapter {
  listActs(projectId: number): Promise<WriterActDoc[]>;
  listChapters(projectId: number, actId?: number): Promise<WriterChapterDoc[]>;
  listPages(projectId: number, chapterId?: number): Promise<WriterPageDoc[]>;

  getAct(actId: number): Promise<WriterActDoc>;
  getChapter(chapterId: number): Promise<WriterChapterDoc>;
  getPage(pageId: number): Promise<WriterPageDoc>;

  updateAct(actId: number, patch: Partial<WriterActDoc>): Promise<WriterActDoc>;
  updateChapter(chapterId: number, patch: Partial<WriterChapterDoc>): Promise<WriterChapterDoc>;
  updatePage(pageId: number, patch: Partial<WriterPageDoc>): Promise<WriterPageDoc>;
}
