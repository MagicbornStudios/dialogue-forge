import type { VideoComposition, VideoCompositionLayer, VideoCompositionScene } from '@magicborn/video/templates/types/video-composition';
import { VIDEO_LAYER_KIND, VIDEO_LAYER_COMPONENT, VIDEO_LAYER_KIND_TO_COMPONENT } from '@magicborn/video/templates/types/video-layer';

import type {
  VideoRenderCompositionDTO,
  VideoRenderCompositionLayerDTO,
  VideoRenderCompositionSceneDTO,
} from './types';

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

// Reverse mapper: Convert DTO back to full VideoComposition
// Note: kind and component are inferred with defaults since DTO doesn't preserve them
const mapLayerFromDTO = (layer: VideoRenderCompositionLayerDTO): VideoCompositionLayer => ({
  id: layer.id,
  sceneId: layer.sceneId,
  kind: VIDEO_LAYER_KIND.BACKGROUND, // Default - DTO doesn't preserve this
  component: VIDEO_LAYER_COMPONENT.BACKGROUND, // Default - DTO doesn't preserve this
  startMs: layer.startMs,
  endMs: layer.endMs,
  opacity: layer.opacity,
  resolvedInputs: layer.resolvedInputs,
});

const mapSceneFromDTO = (scene: VideoRenderCompositionSceneDTO): VideoCompositionScene => ({
  id: scene.id,
  templateSceneId: scene.templateSceneId,
  startMs: scene.startMs,
  durationMs: scene.durationMs,
  layers: scene.layers.map(mapLayerFromDTO),
});

export const mapDTOToVideoComposition = (dto: VideoRenderCompositionDTO): VideoComposition => ({
  id: dto.id,
  templateId: dto.templateId,
  width: dto.width,
  height: dto.height,
  frameRate: dto.frameRate,
  durationMs: dto.durationMs,
  scenes: dto.scenes.map(mapSceneFromDTO),
});
