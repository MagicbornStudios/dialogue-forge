export const WRITER_PATCH_OP = {
  SET_TITLE: 'setTitle',
  REPLACE_SELECTED_TEXT: 'replaceSelectedText',
  INSERT_PARAGRAPH_AFTER_BLOCK: 'insertParagraphAfterBlock',
  REPLACE_BLOCK_TEXT: 'replaceBlockText',
  DELETE_BLOCK: 'deleteBlock',
} as const;

export type WriterSelectionSnapshot = {
  start: number;
  end: number;
  text?: string | null;
  blockId?: string | null;
};

export type WriterDocSnapshot = {
  title?: string | null;
  content: string | null;
  blocks?: unknown[] | null;
};

export type WriterPatchOp =
  | {
      type: typeof WRITER_PATCH_OP.SET_TITLE;
      title: string;
    }
  | {
      type: typeof WRITER_PATCH_OP.REPLACE_SELECTED_TEXT;
      text: string;
      selection: WriterSelectionSnapshot;
    }
  | {
      type: typeof WRITER_PATCH_OP.INSERT_PARAGRAPH_AFTER_BLOCK;
      blockId: string;
      text: string;
    }
  | {
      type: typeof WRITER_PATCH_OP.REPLACE_BLOCK_TEXT;
      blockId: string;
      text: string;
    }
  | {
      type: typeof WRITER_PATCH_OP.DELETE_BLOCK;
      blockId: string;
    };
