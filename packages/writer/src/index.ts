export { WriterWorkspace } from './components/WriterWorkspace/WriterWorkspace';
export { WriterProjectSwitcher } from './components/WriterWorkspace/layout/WriterProjectSwitcher';

export * from './types/writer-ai-types';
export * from './events/writer-events';
export type {
  WriterPageDoc,
  WriterDoc,
  WriterPageContractV2,
  WriterBlockDoc,
  WriterComment,
  WriterThread,
} from './data/writer-types';
export {
  legacyPageToPageContractV2,
  legacyPageToSeedBlockContracts,
  mapPayloadBlockToWriterBlockDoc,
  canonicalBlocksToSerializedContent,
  resolveSerializedContentFromBlocksOrLegacy,
} from './data/writer-page-block-mappers';
export {
  writerQueryKeys,
  useWriterPages,
  useWriterPage,
  useWriterBlocks,
  useWriterComments,
  fetchWriterPages,
  fetchWriterPage,
  fetchWriterBlocks,
  fetchWriterComments,
  useWriterResolvedPageContent,
  useCreateWriterPage,
  useUpdateWriterPage,
  useDeleteWriterPage,
  useCreateWriterBlock,
  useUpdateWriterBlock,
  useDeleteWriterBlock,
  useReorderWriterBlocks,
  useCreateWriterComment,
  useUpdateWriterComment,
  useDeleteWriterComment,
} from './data/writer-queries';
