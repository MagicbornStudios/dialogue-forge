import type { Frame } from '@/src/forge/runtime/types';
import type { TemplateInputKey } from '@/src/shared/types/bindings';
import type { VideoComposition, VideoCompositionLayer, VideoCompositionScene } from '@/src/video/templates/types/video-composition';
import type { VideoLayer } from '@/src/video/templates/types/video-layer';
import type { VideoScene } from '@/src/video/templates/types/video-scene';
import type { VideoTemplate } from '@/src/video/templates/types/video-template';
import { framesToTemplateInputs } from './frames-to-template-inputs';

export type CompositionScenePicker = (frame: Frame, frameIndex: number, template: VideoTemplate) => VideoScene | null;

export type CompileCompositionOptions = {
  selectScene?: CompositionScenePicker;
};

const resolveInputBindings = (
  bindings: Record<string, string> | undefined,
  frameInputs: Record<TemplateInputKey, unknown>,
): Record<string, unknown> | undefined => {
  if (!bindings) {
    return undefined;
  }

  const resolvedEntries = Object.entries(bindings)
    .map(([key, binding]) => [key, frameInputs[binding as TemplateInputKey]] as const)
    .filter(([, value]) => value !== undefined);

  if (resolvedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(resolvedEntries);
};

const mergeResolvedInputs = (
  templateInputs: Record<string, string> | undefined,
  sceneInputs: Record<string, string> | undefined,
  layerInputs: Record<string, string> | undefined,
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
  templateInputs: Record<string, string> | undefined,
  sceneInputs: Record<string, string> | undefined,
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
  const frameInputs = framesToTemplateInputs(frames);

  let currentStartMs = 0;
  const scenes: VideoCompositionScene[] = [];

  frameInputs.forEach((frameInput, frameIndex) => {
    const scene = scenePicker(frames[frameIndex], frameIndex, template);
    if (!scene) {
      return;
    }

    const sceneId = `${frameInput.frameId}:${scene.id}`;
    const durationMs = scene.durationMs;
    const layers = scene.layers.map((layer) =>
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
