import type { TemplateInputKey } from '@/shared/types/bindings';
import type { VideoLayer } from './video-layer';

export interface VideoScene {
  id: string;
  name?: string;
  durationMs: number;
  layers: VideoLayer[];
  inputs?: Record<string, TemplateInputKey>;
}
