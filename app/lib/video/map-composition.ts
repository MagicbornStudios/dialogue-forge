import type { VideoComposition } from '@/video/templates/types/video-composition';

import type {
  VideoRenderCompositionDTO,
  VideoRenderCompositionLayerDTO,
  VideoRenderCompositionSceneDTO,
} from '@/app/lib/video/types';

const mapLayer = (layer: VideoComposition['scenes'][number]['layers'][number]): VideoRenderCompositionLayerDTO => ({
  id: layer.id,
  sceneId: layer.sceneId,
  startMs: layer.startMs,
  endMs: layer.endMs,
  opacity: layer.opacity,
  resolvedInputs: layer.resolvedInputs,
});

const mapScene = (scene: VideoComposition['scenes'][number]): VideoRenderCompositionSceneDTO => ({
  id: scene.id,
  templateSceneId: scene.templateSceneId,
  startMs: scene.startMs,
  durationMs: scene.durationMs,
  layers: scene.layers.map(mapLayer),
});

export const mapVideoCompositionToDTO = (composition: VideoComposition): VideoRenderCompositionDTO => ({
  id: composition.id,
  templateId: composition.templateId,
  width: composition.width,
  height: composition.height,
  frameRate: composition.frameRate,
  durationMs: composition.durationMs,
  scenes: composition.scenes.map(mapScene),
});
