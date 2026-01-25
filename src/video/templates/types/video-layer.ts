import type { VideoTemplateInputBindings } from './video-template-input-bindings';

export const VIDEO_LAYER_KIND = {
  BACKGROUND: 'background',
  DIALOGUE_CARD: 'dialogue_card',
  PORTRAIT: 'portrait',
  LOWER_THIRD: 'lower_third',
} as const;

export type VideoLayerKind = typeof VIDEO_LAYER_KIND[keyof typeof VIDEO_LAYER_KIND];

export const VIDEO_LAYER_COMPONENT = {
  BACKGROUND: 'BackgroundImage',
  DIALOGUE_CARD: 'DialogueCard',
  PORTRAIT: 'Portrait',
  LOWER_THIRD: 'LowerThird',
} as const;

export type VideoLayerComponent = typeof VIDEO_LAYER_COMPONENT[keyof typeof VIDEO_LAYER_COMPONENT];

export const VIDEO_LAYER_KIND_TO_COMPONENT: Record<VideoLayerKind, VideoLayerComponent> = {
  [VIDEO_LAYER_KIND.BACKGROUND]: VIDEO_LAYER_COMPONENT.BACKGROUND,
  [VIDEO_LAYER_KIND.DIALOGUE_CARD]: VIDEO_LAYER_COMPONENT.DIALOGUE_CARD,
  [VIDEO_LAYER_KIND.PORTRAIT]: VIDEO_LAYER_COMPONENT.PORTRAIT,
  [VIDEO_LAYER_KIND.LOWER_THIRD]: VIDEO_LAYER_COMPONENT.LOWER_THIRD,
};

export interface VideoLayer {
  id: string;
  name?: string;
  kind: VideoLayerKind;
  startMs: number;
  durationMs?: number;
  opacity?: number;
  inputs?: VideoTemplateInputBindings;
}
