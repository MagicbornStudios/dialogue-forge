import type { ForgePage } from '@/shared/types/narrative';
import type { WriterMediaRecord, WriterMediaUploadResult } from './media';
import type { Comment, Thread } from '@/writer/components/WriterWorkspace/editor/lexical/commenting';

export type WriterPageDoc = ForgePage;
export type WriterDoc = WriterPageDoc;

export type WriterComment = Comment & {
  pageId: number;
  nodeKey?: string;
  threadId?: string | null;
};

export type WriterThread = Thread & {
  pageId: number;
  nodeKey?: string;
};

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

  // Comment operations
  listComments(pageId: number): Promise<Array<WriterComment | WriterThread>>;
  createComment(pageId: number, comment: {
    author: string;
    content: string;
    nodeKey?: string;
    threadId?: string | null;
    quote?: string;
  }): Promise<WriterComment | WriterThread>;
  updateComment(pageId: number, commentId: string, patch: Partial<WriterComment>): Promise<WriterComment>;
  deleteComment(pageId: number, commentId: string): Promise<void>;
}
