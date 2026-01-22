import type { VideoCompositionScene } from '../types/video-composition';
import type { NormalizedVideoTemplate } from './normalize-timeline';

export interface StitchedScenes {
  durationMs: number;
  scenes: VideoCompositionScene[];
}

export const stitchScenes = (template: NormalizedVideoTemplate): StitchedScenes => {
  let cursorMs = 0;

  const scenes = template.scenes.map((scene) => {
    const sceneStartMs = cursorMs;
    cursorMs += scene.durationMs;

    return {
      id: scene.id,
      templateSceneId: scene.id,
      startMs: sceneStartMs,
      durationMs: scene.durationMs,
      layers: scene.layers.map((layer) => ({
        id: layer.id,
        sceneId: scene.id,
        startMs: sceneStartMs + layer.startMs,
        endMs: sceneStartMs + layer.startMs + layer.durationMs,
        opacity: layer.opacity,
      })),
    };
  });

  return {
    durationMs: cursorMs,
    scenes,
  };
};
