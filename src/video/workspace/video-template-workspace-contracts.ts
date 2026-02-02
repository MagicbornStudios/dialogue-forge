import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateMediaRecord } from '@/video/lib/media-resolver';

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

export interface VideoTemplateMediaResolution extends VideoTemplateMediaRecord {
  kind: VideoMediaKind;
  durationMs?: number;
}

export interface VideoTemplateWorkspaceAdapter {
  listTemplates(): Promise<VideoTemplateWorkspaceTemplateSummary[]>;
  loadTemplate(templateId: string): Promise<VideoTemplate | null>;
  saveTemplate(template: VideoTemplate): Promise<VideoTemplate>;
  deleteTemplate?(templateId: string): Promise<void>;
  resolveMedia(request: VideoTemplateMediaRequest): Promise<VideoTemplateMediaResolution | null>;
}
