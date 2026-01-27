import type { VideoTemplateInputBindings } from './video-template-input-bindings';

export const VIDEO_LAYER_KIND = {
  BACKGROUND: 'background',
  DIALOGUE_CARD: 'dialogue_card',
  PORTRAIT: 'portrait',
  LOWER_THIRD: 'lower_third',
  TEXT: 'text',
  IMAGE: 'image',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  VIDEO: 'video',
} as const;

export type VideoLayerKind = typeof VIDEO_LAYER_KIND[keyof typeof VIDEO_LAYER_KIND];

export const VIDEO_LAYER_COMPONENT = {
  BACKGROUND: 'BackgroundImage',
  DIALOGUE_CARD: 'DialogueCard',
  PORTRAIT: 'Portrait',
  LOWER_THIRD: 'LowerThird',
  TEXT: 'Text',
  IMAGE: 'Image',
  RECTANGLE: 'Rectangle',
  CIRCLE: 'Circle',
  VIDEO: 'Video',
} as const;

export type VideoLayerComponent = typeof VIDEO_LAYER_COMPONENT[keyof typeof VIDEO_LAYER_COMPONENT];

export const VIDEO_LAYER_KIND_TO_COMPONENT: Record<VideoLayerKind, VideoLayerComponent> = {
  [VIDEO_LAYER_KIND.BACKGROUND]: VIDEO_LAYER_COMPONENT.BACKGROUND,
  [VIDEO_LAYER_KIND.DIALOGUE_CARD]: VIDEO_LAYER_COMPONENT.DIALOGUE_CARD,
  [VIDEO_LAYER_KIND.PORTRAIT]: VIDEO_LAYER_COMPONENT.PORTRAIT,
  [VIDEO_LAYER_KIND.LOWER_THIRD]: VIDEO_LAYER_COMPONENT.LOWER_THIRD,
  [VIDEO_LAYER_KIND.TEXT]: VIDEO_LAYER_COMPONENT.TEXT,
  [VIDEO_LAYER_KIND.IMAGE]: VIDEO_LAYER_COMPONENT.IMAGE,
  [VIDEO_LAYER_KIND.RECTANGLE]: VIDEO_LAYER_COMPONENT.RECTANGLE,
  [VIDEO_LAYER_KIND.CIRCLE]: VIDEO_LAYER_COMPONENT.CIRCLE,
  [VIDEO_LAYER_KIND.VIDEO]: VIDEO_LAYER_COMPONENT.VIDEO,
};

export interface VideoLayerVisualProperties {
  x?: number;           // Position in pixels from left
  y?: number;           // Position in pixels from top
  width?: number;       // Width in pixels
  height?: number;      // Height in pixels
  rotation?: number;     // Rotation in degrees (0-360)
  scale?: number;        // Scale factor (1.0 = 100%)
  anchorX?: number;     // Anchor point X (0-1, relative to width)
  anchorY?: number;     // Anchor point Y (0-1, relative to height)
}

export interface VideoLayerStyleProperties {
  backgroundColor?: string;  // CSS color value
  borderColor?: string;      // CSS color value
  borderWidth?: number;     // Border width in pixels
  borderRadius?: number;     // Border radius in pixels
  fontFamily?: string;       // Font family for text layers
  fontSize?: number;         // Font size in pixels
  fontWeight?: string;       // CSS font-weight
  color?: string;           // Text color
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;       // Line height multiplier
  letterSpacing?: number;    // Letter spacing in pixels
}

export interface VideoLayer {
  id: string;
  name?: string;
  kind: VideoLayerKind;
  startMs: number;
  durationMs?: number;
  opacity?: number;
  inputs?: VideoTemplateInputBindings;
  
  // Visual positioning and sizing
  visual?: VideoLayerVisualProperties;
  
  // Styling properties
  style?: VideoLayerStyleProperties;
}
