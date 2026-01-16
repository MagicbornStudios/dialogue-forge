export const FORGE_MEDIA_KIND = {
  IMAGE: 'image',
  VIDEO: 'video',
  FILE: 'file',
} as const;

export type ForgeMediaKind = (typeof FORGE_MEDIA_KIND)[keyof typeof FORGE_MEDIA_KIND];

export type ForgeMediaRecord = {
  id: string;
  url: string | null;
  width?: number | null;
  height?: number | null;
  kind?: ForgeMediaKind | null;
};

export interface ForgeMediaAdapter {
  resolveMedia(mediaId: string): Promise<ForgeMediaRecord | null>;
}
