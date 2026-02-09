import type { ForgePage } from '@magicborn/shared/types/narrative';
import type {
  BlockContractV2,
  PageContractV2,
} from '@magicborn/shared/types/page-contract-v2';
import type {
  Comment,
  Thread,
} from '@magicborn/writer/components/WriterWorkspace/editor/lexical/commenting';

export type WriterPageDoc = ForgePage;
export type WriterDoc = WriterPageDoc;
export type WriterPageContractV2 = PageContractV2;
export type WriterBlockDoc = BlockContractV2;

export type WriterComment = Comment & {
  pageId: number;
  nodeKey?: string;
  threadId?: string | null;
};

export type WriterThread = Thread & {
  pageId: number;
  nodeKey?: string;
};
