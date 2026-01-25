export const VIDEO_RENDER_FORMAT = {
  MP4: 'mp4',
  WEBM: 'webm',
} as const;

export type VideoRenderFormat = (typeof VIDEO_RENDER_FORMAT)[keyof typeof VIDEO_RENDER_FORMAT];

export const VIDEO_RENDER_RESPONSE_MODE = {
  STREAM: 'stream',
  URL: 'url',
} as const;

export type VideoRenderResponseMode = (typeof VIDEO_RENDER_RESPONSE_MODE)[keyof typeof VIDEO_RENDER_RESPONSE_MODE];

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

export interface VideoRenderInputProps {
  composition: VideoRenderCompositionDTO;
  settings: VideoRenderSettingsDTO;
}
