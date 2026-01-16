export const WRITER_MEDIA_ALIGNMENT = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
} as const;

export type WriterMediaAlignment =
  (typeof WRITER_MEDIA_ALIGNMENT)[keyof typeof WRITER_MEDIA_ALIGNMENT];

export const WRITER_LEXICAL_NODE_TYPE = {
  IMAGE: 'writer-image',
  FILE: 'writer-file',
  EMBED: 'writer-embed',
} as const;
