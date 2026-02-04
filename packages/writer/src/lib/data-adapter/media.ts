export const WRITER_MEDIA_KIND = {
  IMAGE: 'image',
  FILE: 'file',
  EMBED: 'embed',
} as const;

export type WriterMediaKind = (typeof WRITER_MEDIA_KIND)[keyof typeof WRITER_MEDIA_KIND];

export type WriterMediaRecord = {
  id: string;
  url: string | null;
  filename?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  title?: string | null;
  kind?: WriterMediaKind | null;
};

export type WriterMediaUploadResult = {
  mediaId: string;
  record?: WriterMediaRecord | null;
};
