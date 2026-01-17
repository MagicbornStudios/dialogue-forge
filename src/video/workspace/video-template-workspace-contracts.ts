import type { VideoTemplate } from '@/video/templates/types/video-template';

export const VIDEO_MEDIA_KIND = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
} as const;

export type VideoMediaKind = (typeof VIDEO_MEDIA_KIND)[keyof typeof VIDEO_MEDIA_KIND];

export interface VideoTemplateWorkspaceTemplateSummary {
  id: string;
  name: string;
  updatedAt?: string;
}

export interface VideoTemplateMediaRequest {
  mediaId: string;
  kind: VideoMediaKind;
}

export interface VideoTemplateMediaResolution {
  mediaId: string;
  url: string;
  kind: VideoMediaKind;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface VideoTemplateWorkspaceAdapter {
  listTemplates(): Promise<VideoTemplateWorkspaceTemplateSummary[]>;
  loadTemplate(templateId: string): Promise<VideoTemplate | null>;
  saveTemplate(template: VideoTemplate): Promise<VideoTemplate>;
  resolveMedia(request: VideoTemplateMediaRequest): Promise<VideoTemplateMediaResolution | null>;
}
