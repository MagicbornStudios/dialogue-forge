import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import {
  EmbedBlockNode,
  FileAttachmentNode,
  ImageBlockNode,
} from '@/writer/components/WriterWorkspace/editor/lexical/nodes/MediaNodes';

export const writerNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  ImageBlockNode,
  FileAttachmentNode,
  EmbedBlockNode,
];
