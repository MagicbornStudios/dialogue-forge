import type { TemplateInputKey } from '@/shared/types/bindings';
import type { VideoScene } from './video-scene';

export interface VideoTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  frameRate: number;
  scenes: VideoScene[];
  inputs?: Record<string, TemplateInputKey>;
}
