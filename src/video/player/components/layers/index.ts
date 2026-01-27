import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';
import { TextLayer } from './Text';
import { RectangleLayer } from './Rectangle';
import { CircleLayer } from './Circle';
import { ImageLayer } from './Image';
import { VideoLayer } from './Video';
import { BackgroundLayer } from './Background';

export { TextLayer } from './Text';
export { RectangleLayer } from './Rectangle';
export { CircleLayer } from './Circle';
export { ImageLayer } from './Image';
export { VideoLayer } from './Video';
export { BackgroundLayer } from './Background';

// Layer component registry
export const LAYER_COMPONENT_MAP = {
  [VIDEO_LAYER_KIND.TEXT]: TextLayer,
  [VIDEO_LAYER_KIND.RECTANGLE]: RectangleLayer,
  [VIDEO_LAYER_KIND.CIRCLE]: CircleLayer,
  [VIDEO_LAYER_KIND.IMAGE]: ImageLayer,
  [VIDEO_LAYER_KIND.VIDEO]: VideoLayer,
  [VIDEO_LAYER_KIND.BACKGROUND]: BackgroundLayer,
  // Future: Add other layer types as needed
  [VIDEO_LAYER_KIND.DIALOGUE_CARD]: RectangleLayer, // Placeholder
  [VIDEO_LAYER_KIND.PORTRAIT]: ImageLayer, // Placeholder
  [VIDEO_LAYER_KIND.LOWER_THIRD]: RectangleLayer, // Placeholder
} as const;
