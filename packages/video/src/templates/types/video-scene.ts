import type { VideoLayer } from './video-layer';
import type { VideoTemplateInputBindings } from './video-template-input-bindings';

export interface VideoScene {
  id: string;
  name?: string;
  durationMs: number;
  layers: VideoLayer[];
  inputs?: VideoTemplateInputBindings;
}
