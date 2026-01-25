import type { VideoScene } from './video-scene';
import type { VideoTemplateInputBindings } from './video-template-input-bindings';

export interface VideoTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  frameRate: number;
  scenes: VideoScene[];
  inputs?: VideoTemplateInputBindings;
}
