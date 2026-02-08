export { WriterWorkspace } from './components/WriterWorkspace/WriterWorkspace';
export { WriterProjectSwitcher } from './components/WriterWorkspace/layout/WriterProjectSwitcher';

export * from './types/writer-ai-types';
export * from './events/writer-events';
export type {
  WriterPageDoc,
  WriterDoc,
  WriterComment,
  WriterThread,
} from './data/writer-types';
export {
  writerQueryKeys,
  useWriterPages,
  useWriterPage,
  useWriterComments,
  fetchWriterPages,
  fetchWriterPage,
  fetchWriterComments,
  useCreateWriterPage,
  useUpdateWriterPage,
  useDeleteWriterPage,
  useCreateWriterComment,
  useUpdateWriterComment,
  useDeleteWriterComment,
} from './data/writer-queries';
