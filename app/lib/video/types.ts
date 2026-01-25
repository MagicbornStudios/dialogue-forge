export const VIDEO_RENDER_FORMAT = {
  MP4: 'mp4',
  WEBM: 'webm',
} as const;

export type VideoRenderFormat = (typeof VIDEO_RENDER_FORMAT)[keyof typeof VIDEO_RENDER_FORMAT];

export const VIDEO_RENDER_RESPONSE_MODE = {
  STREAM: 'stream',
  URL: 'url',
  ASYNC: 'async',
} as const;

export type VideoRenderResponseMode = (typeof VIDEO_RENDER_RESPONSE_MODE)[keyof typeof VIDEO_RENDER_RESPONSE_MODE];

export const VIDEO_RENDER_JOB_STATUS = {
  QUEUED: 'queued',
  RENDERING: 'rendering',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type VideoRenderJobStatus = (typeof VIDEO_RENDER_JOB_STATUS)[keyof typeof VIDEO_RENDER_JOB_STATUS];

export interface VideoRenderCompositionLayerDTO {
  id: string;
  sceneId: string;
  startMs: number;
  endMs: number;
  opacity?: number;
  resolvedInputs?: Record<string, unknown>;
}

export interface VideoRenderCompositionSceneDTO {
  id: string;
  templateSceneId: string;
  startMs: number;
  durationMs: number;
  layers: VideoRenderCompositionLayerDTO[];
}

export interface VideoRenderCompositionDTO {
  id: string;
  templateId: string;
  width: number;
  height: number;
  frameRate: number;
  durationMs: number;
  scenes: VideoRenderCompositionSceneDTO[];
}

export interface VideoRenderSettingsDTO {
  fps: number;
  width: number;
  height: number;
  format: VideoRenderFormat;
}

export interface VideoRenderRequestDTO {
  composition: VideoRenderCompositionDTO;
  settings: VideoRenderSettingsDTO;
  responseMode?: VideoRenderResponseMode;
}

export interface VideoRenderResponseDTO {
  id: string;
  filename: string;
  url: string;
}

export interface VideoRenderJobResponseDTO {
  id: string;
  status: VideoRenderJobStatus;
  statusUrl: string;
}

export interface VideoRenderJobStatusDTO {
  id: string;
  status: VideoRenderJobStatus;
  progress?: number;
  url?: string;
  error?: string;
}

export interface VideoRenderInputProps {
  composition: VideoRenderCompositionDTO;
  settings: VideoRenderSettingsDTO;
}
