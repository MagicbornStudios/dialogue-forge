import type { Frame } from '@/forge/runtime/types';
import type { TemplateInputKey } from '@/shared/types/bindings';
import type { VideoComposition, VideoCompositionLayer, VideoCompositionScene } from '@/video/templates/types/video-composition';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import { framesToTemplateInputs, type FrameTemplateInputs } from './frames-to-template-inputs';

export type CompositionScenePicker = (frame: Frame, frameIndex: number, template: VideoTemplate) => VideoScene | null;

export type CompileCompositionOptions = {
  selectScene?: CompositionScenePicker;
  frameInputs?: FrameTemplateInputs[];
};

const resolveInputBindings = (
  bindings: Record<string, TemplateInputKey> | undefined,
  frameInputs: Record<TemplateInputKey, unknown>,
): Record<string, unknown> | undefined => {
  if (!bindings) {
    return undefined;
  }

  const resolvedEntries = Object.entries(bindings)
    .map(([key, binding]) => [key, frameInputs[binding]] as const)
    .filter(([, value]) => value !== undefined);

  if (resolvedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(resolvedEntries);
};

const mergeResolvedInputs = (
  templateInputs: Record<string, TemplateInputKey> | undefined,
  sceneInputs: Record<string, TemplateInputKey> | undefined,
  layerInputs: Record<string, TemplateInputKey> | undefined,
  frameInputs: Record<TemplateInputKey, unknown>,
): Record<string, unknown> | undefined => {
  const resolvedTemplateInputs = resolveInputBindings(templateInputs, frameInputs);
  const resolvedSceneInputs = resolveInputBindings(sceneInputs, frameInputs);
  const resolvedLayerInputs = resolveInputBindings(layerInputs, frameInputs);

  const merged = {
    ...(resolvedTemplateInputs ?? {}),
    ...(resolvedSceneInputs ?? {}),
    ...(resolvedLayerInputs ?? {}),
  };

  if (Object.keys(merged).length === 0) {
    return undefined;
  }

  return merged;
};

const buildCompositionLayer = (
  layer: VideoLayer,
  sceneStartMs: number,
  sceneDurationMs: number,
  frameInputs: Record<TemplateInputKey, unknown>,
  templateInputs: Record<string, TemplateInputKey> | undefined,
  sceneInputs: Record<string, TemplateInputKey> | undefined,
  frameId: string,
  sceneId: string,
): VideoCompositionLayer => {
  const durationMs = layer.durationMs ?? sceneDurationMs;
  const resolvedInputs = mergeResolvedInputs(templateInputs, sceneInputs, layer.inputs, frameInputs);

  return {
    id: `${frameId}:${sceneId}:${layer.id}`,
    sceneId,
    startMs: sceneStartMs + layer.startMs,
    endMs: sceneStartMs + Math.max(0, durationMs),
    opacity: layer.opacity,
    resolvedInputs,
  };
};

export const compileCompositionFromFrames = (
  template: VideoTemplate,
  frames: Frame[],
  options: CompileCompositionOptions = {},
): VideoComposition => {
  const scenePicker: CompositionScenePicker =
    options.selectScene ??
    ((frame, frameIndex, templateDoc) => {
      if (templateDoc.scenes.length === 0) {
        return null;
      }

      return templateDoc.scenes[frameIndex % templateDoc.scenes.length] ?? null;
    });
  const frameInputs = options.frameInputs ?? framesToTemplateInputs(frames);

  let currentStartMs = 0;
  const scenes: VideoCompositionScene[] = [];

  frameInputs.forEach((frameInput, frameIndex) => {
    const frame = frames[frameIndex];
    if (!frame) {
      return;
    }

    const scene = scenePicker(frame, frameIndex, template);
    if (!scene) {
      return;
    }

    const sceneId = `${frameInput.frameId}:${scene.id}`;
    const durationMs = scene.durationMs;
    const layers = scene.layers.map((layer: VideoLayer) =>
      buildCompositionLayer(
        layer,
        currentStartMs,
        durationMs,
        frameInput.inputs,
        template.inputs,
        scene.inputs,
        frameInput.frameId,
        sceneId,
      ),
    );

    scenes.push({
      id: sceneId,
      templateSceneId: scene.id,
      startMs: currentStartMs,
      durationMs,
      layers,
    });

    currentStartMs += durationMs;
  });

  return {
    id: `${template.id}-composition`,
    templateId: template.id,
    width: template.width,
    height: template.height,
    frameRate: template.frameRate,
    durationMs: currentStartMs,
    scenes,
  };
};
