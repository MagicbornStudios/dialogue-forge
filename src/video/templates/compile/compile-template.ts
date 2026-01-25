import type { TemplateInputKey } from '../../../shared/types/bindings';
import type { VideoComposition, VideoCompositionLayer } from '../types/video-composition';
import type { VideoTemplateInputBindings } from '../types/video-template-input-bindings';
import type { VideoTemplate } from '../types/video-template';
import { normalizeTimeline } from './normalize-timeline';
import { resolveBindings, type TemplateInputs } from './resolve-bindings';
import { stitchScenes } from './stitch-scenes';

export type TemplateInputBindingMap = Record<TemplateInputKey, unknown>;

const mergeResolvedInputs = (
  ...resolvedInputsList: Array<Record<string, unknown> | undefined>
): Record<string, unknown> | undefined => {
  const merged = resolvedInputsList.reduce<Record<string, unknown>>((accumulator, resolved) => {
    if (resolved) {
      return {
        ...accumulator,
        ...resolved,
      };
    }

    return accumulator;
  }, {});

  return Object.keys(merged).length > 0 ? merged : undefined;
};

const collectMissing = (collector: Set<TemplateInputKey>, missing: TemplateInputKey[]): void => {
  missing.forEach((key) => collector.add(key));
};

const collectBindings = (
  collector: Set<TemplateInputKey>,
  bindings: VideoTemplateInputBindings | undefined,
): void => {
  if (!bindings) {
    return;
  }

  Object.values(bindings).forEach((key) => collector.add(key));
};

const applyResolvedInputs = (
  layer: VideoCompositionLayer,
  templateInputs: Record<string, unknown> | undefined,
  sceneInputs: Record<string, unknown> | undefined,
  layerInputs: Record<string, unknown> | undefined,
): VideoCompositionLayer => {
  const resolvedInputs = mergeResolvedInputs(templateInputs, sceneInputs, layerInputs);

  if (!resolvedInputs) {
    return layer;
  }

  return {
    ...layer,
    resolvedInputs,
  };
};

export interface VideoTemplateCompileResult {
  composition: VideoComposition;
  bindingMap: TemplateInputBindingMap;
}

export const compileTemplate = (
  template: VideoTemplate,
  inputs: TemplateInputs = {},
): VideoTemplateCompileResult => {
  const normalizedTemplate = normalizeTimeline(template);
  const stitched = stitchScenes(normalizedTemplate);

  const missingBindings = new Set<TemplateInputKey>();
  const usedBindings = new Set<TemplateInputKey>();

  const templateBindings = resolveBindings(template.inputs, inputs);
  collectMissing(missingBindings, templateBindings.missing);
  collectBindings(usedBindings, template.inputs);

  const sceneById = new Map(normalizedTemplate.scenes.map((scene) => [scene.id, scene]));

  const scenes = stitched.scenes.map((scene) => {
    const templateScene = sceneById.get(scene.templateSceneId);
    if (!templateScene) {
      return scene;
    }

    const sceneBindings = resolveBindings(templateScene.inputs, inputs);
    collectMissing(missingBindings, sceneBindings.missing);
    collectBindings(usedBindings, templateScene.inputs);

    const layers = scene.layers.map((layer) => {
      const templateLayer = templateScene.layers.find((candidate) => candidate.id === layer.id);
      const layerBindings = resolveBindings(templateLayer?.inputs, inputs);
      collectMissing(missingBindings, layerBindings.missing);
      collectBindings(usedBindings, templateLayer?.inputs);

      return applyResolvedInputs(
        layer,
        templateBindings.resolvedInputs,
        sceneBindings.resolvedInputs,
        layerBindings.resolvedInputs,
      );
    });

    return {
      ...scene,
      layers,
    };
  });

  if (missingBindings.size > 0) {
    const missingList = [...missingBindings].sort().join(', ');
    throw new Error(`Missing template inputs: ${missingList}`);
  }

  const bindingMap = [...usedBindings].sort().reduce<TemplateInputBindingMap>((accumulator, key) => {
    accumulator[key] = inputs[key];
    return accumulator;
  }, {});

  return {
    composition: {
      id: template.id,
      templateId: template.id,
      width: template.width,
      height: template.height,
      frameRate: template.frameRate,
      durationMs: stitched.durationMs,
      scenes,
    },
    bindingMap,
  };
};
