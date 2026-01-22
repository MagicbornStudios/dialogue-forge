import type { VideoLayer } from '../types/video-layer';
import type { VideoScene } from '../types/video-scene';
import type { VideoTemplate } from '../types/video-template';

export interface NormalizedVideoLayer extends VideoLayer {
  durationMs: number;
}

export interface NormalizedVideoScene extends Omit<VideoScene, 'layers'> {
  layers: NormalizedVideoLayer[];
}

export interface NormalizedVideoTemplate extends Omit<VideoTemplate, 'scenes'> {
  scenes: NormalizedVideoScene[];
}

const sortByStartThenId = <T extends { startMs: number; id: string }>(items: T[]): T[] => {
  return [...items].sort((left, right) => {
    if (left.startMs !== right.startMs) {
      return left.startMs - right.startMs;
    }

    return left.id.localeCompare(right.id);
  });
};

const normalizeLayerDuration = (layer: VideoLayer, sceneDurationMs: number): NormalizedVideoLayer => {
  const fallbackDuration = Math.max(sceneDurationMs - layer.startMs, 0);
  const durationMs = layer.durationMs ?? fallbackDuration;

  return {
    ...layer,
    durationMs: Math.max(durationMs, 0),
  };
};

export const normalizeTimeline = (template: VideoTemplate): NormalizedVideoTemplate => {
  return {
    ...template,
    scenes: template.scenes.map((scene) => {
      const layers = sortByStartThenId(
        scene.layers.map((layer) => normalizeLayerDuration(layer, scene.durationMs)),
      );

      return {
        ...scene,
        layers,
      };
    }),
  };
};
