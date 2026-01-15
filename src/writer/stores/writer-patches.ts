import {
  WRITER_PATCH_OP,
  type WriterDocSnapshot,
  type WriterPatchOp,
} from '@/ai/aiadapter/domains/writer/writer-ai-types';

type WriterBlockRecord = Record<string, unknown> & {
  id?: string;
  text?: string;
  content?: string;
};

const isWriterBlockRecord = (value: unknown): value is WriterBlockRecord =>
  Boolean(value && typeof value === 'object');

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const applySelectionReplace = (
  content: string,
  selection: { start: number; end: number },
  text: string
) => {
  const start = clamp(selection.start, 0, content.length);
  const end = clamp(selection.end, start, content.length);
  return `${content.slice(0, start)}${text}${content.slice(end)}`;
};

const getBlockId = (block: unknown) => {
  if (!isWriterBlockRecord(block)) {
    return null;
  }
  return typeof block.id === 'string' ? block.id : null;
};

const updateBlockText = (block: WriterBlockRecord, text: string): WriterBlockRecord => {
  if ('text' in block) {
    return { ...block, text };
  }
  if ('content' in block) {
    return { ...block, content: text };
  }
  return { ...block, text };
};

const buildContentFromBlocks = (blocks: unknown[], fallback: string) => {
  const textBlocks = blocks
    .map((block) => {
      if (!isWriterBlockRecord(block)) {
        return null;
      }
      if (typeof block.text === 'string') {
        return block.text;
      }
      if (typeof block.content === 'string') {
        return block.content;
      }
      return null;
    })
    .filter((value): value is string => typeof value === 'string');

  if (textBlocks.length === 0) {
    return fallback;
  }

  return textBlocks.join('\n\n');
};

export function applyWriterPatchOps(
  snapshot: WriterDocSnapshot,
  ops: WriterPatchOp[]
): WriterDocSnapshot {
  let content = snapshot.content ?? '';
  let blocks = snapshot.blocks ?? null;
  let title = snapshot.title ?? null;

  ops.forEach((op) => {
    switch (op.type) {
      case WRITER_PATCH_OP.SET_TITLE:
        title = op.title;
        break;
      case WRITER_PATCH_OP.REPLACE_SELECTED_TEXT: {
        content = applySelectionReplace(content, op.selection, op.text);
        break;
      }
      case WRITER_PATCH_OP.INSERT_PARAGRAPH_AFTER_BLOCK: {
        if (!Array.isArray(blocks)) {
          break;
        }
        const nextBlocks = [...blocks];
        const index = nextBlocks.findIndex(
          (block) => getBlockId(block) === op.blockId
        );
        const insertIndex = index >= 0 ? index + 1 : nextBlocks.length;
        nextBlocks.splice(insertIndex, 0, {
          id: `${op.blockId}-inserted`,
          text: op.text,
        });
        blocks = nextBlocks;
        content = buildContentFromBlocks(nextBlocks, content);
        break;
      }
      case WRITER_PATCH_OP.REPLACE_BLOCK_TEXT: {
        if (!Array.isArray(blocks)) {
          break;
        }
        let updated = false;
        const nextBlocks = blocks.map((block) => {
          if (getBlockId(block) !== op.blockId) {
            return block;
          }
          updated = true;
          return isWriterBlockRecord(block)
            ? updateBlockText(block, op.text)
            : block;
        });
        if (updated) {
          blocks = nextBlocks;
          content = buildContentFromBlocks(nextBlocks, content);
        }
        break;
      }
      case WRITER_PATCH_OP.DELETE_BLOCK: {
        if (!Array.isArray(blocks)) {
          break;
        }
        const nextBlocks = blocks.filter(
          (block) => getBlockId(block) !== op.blockId
        );
        if (nextBlocks.length !== blocks.length) {
          blocks = nextBlocks;
          content = buildContentFromBlocks(nextBlocks, content);
        }
        break;
      }
      default:
        break;
    }
  });

  return {
    title,
    content,
    blocks,
  };
}
