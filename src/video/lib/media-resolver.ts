import type { VideoMediaKind } from '@/video/workspace/video-template-workspace-contracts';

export type VideoTemplateMediaRecord = {
  id: string;
  url: string | null;
  externalUrl?: string | null;
  secureUrl?: string | null;
  width?: number | null;
  height?: number | null;
  kind?: VideoMediaKind | null;
};

export type VideoTemplateMediaResolver = (mediaId: string) => Promise<VideoTemplateMediaRecord | null>;
