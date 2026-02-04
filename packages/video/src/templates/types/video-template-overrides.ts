import type { VideoTemplateInputOverrides } from './video-template-input-overrides';

export interface VideoTemplateOverrides {
  inputs?: VideoTemplateInputOverrides;
  frameInputs?: Record<string, VideoTemplateInputOverrides>;
}
