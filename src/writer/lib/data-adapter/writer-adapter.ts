import type { ForgePage } from '@/forge/types/narrative';
import type { WriterMediaRecord, WriterMediaUploadResult } from './media';

export type WriterPageDoc = ForgePage;
export type WriterDoc = WriterPageDoc;

/**
 * Writer Data Adapter Interface
 * 
 * Provides CRUD operations for the Writer workspace.
 * All methods operate on the unified Pages collection.
 */
export interface WriterDataAdapter {
  // Unified page operations (works for all pageTypes: ACT, CHAPTER, PAGE)
  listPages(projectId: number): Promise<WriterPageDoc[]>;
  getPage(pageId: number): Promise<WriterPageDoc>;
  createPage(input: {
    projectId: number;
    pageType: 'ACT' | 'CHAPTER' | 'PAGE';
    title: string;
    order: number;
    parent?: number | null;
    bookBody?: string | null;
  }): Promise<WriterPageDoc>;
  updatePage(pageId: number, patch: Partial<WriterPageDoc>): Promise<WriterPageDoc>;
  deletePage(pageId: number): Promise<void>;

  // Media operations (optional)
  uploadMedia?(file: File): Promise<WriterMediaUploadResult>;
  resolveMedia?(mediaId: string): Promise<WriterMediaRecord | null>;
  createEmbed?(url: string): Promise<WriterMediaUploadResult>;
}
