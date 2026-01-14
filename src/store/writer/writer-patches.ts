export const WRITER_PATCH_OP = {
  REPLACE_CONTENT: 'replace_content',
  SPLICE_CONTENT: 'splice_content',
  REPLACE_BLOCKS: 'replace_blocks',
} as const;

export type WriterPatchOp =
  | {
      type: typeof WRITER_PATCH_OP.REPLACE_CONTENT;
      content: string | null;
    }
  | {
      type: typeof WRITER_PATCH_OP.SPLICE_CONTENT;
      start: number;
      end: number;
      text: string;
    }
  | {
      type: typeof WRITER_PATCH_OP.REPLACE_BLOCKS;
      blocks: unknown[] | null;
    };

export type WriterSelectionRange = {
  start: number;
  end: number;
};

export type WriterDocSnapshot = {
  content: string | null;
  blocks?: unknown[] | null;
};

export function applyWriterPatchOps(
  snapshot: WriterDocSnapshot,
  ops: WriterPatchOp[]
): WriterDocSnapshot {
  let content = snapshot.content ?? '';
  let blocks = snapshot.blocks ?? null;

  ops.forEach((op) => {
    switch (op.type) {
      case WRITER_PATCH_OP.REPLACE_CONTENT:
        content = op.content ?? '';
        break;
      case WRITER_PATCH_OP.SPLICE_CONTENT: {
        const safeContent = content ?? '';
        const start = Math.max(0, Math.min(safeContent.length, op.start));
        const end = Math.max(start, Math.min(safeContent.length, op.end));
        content = `${safeContent.slice(0, start)}${op.text}${safeContent.slice(
          end
        )}`;
        break;
      }
      case WRITER_PATCH_OP.REPLACE_BLOCKS:
        blocks = op.blocks ?? null;
        break;
      default:
        break;
    }
  });

  return {
    content,
    blocks,
  };
}
