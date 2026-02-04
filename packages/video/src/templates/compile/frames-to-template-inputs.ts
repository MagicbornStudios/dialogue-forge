import { TEMPLATE_INPUT_KEY, type TemplateInputKey } from '@magicborn/shared/types/bindings';
import type { Frame, PresentationLayer, PresentationState } from '@magicborn/runtime/types';

export type FrameTemplateInputs = {
  frameId: string;
  kind: Frame['kind'];
  source: Frame['source'];
  inputs: Record<TemplateInputKey, unknown>;
};

const resolvePresentationValue = (layer?: PresentationLayer): unknown => {
  if (!layer) {
    return undefined;
  }

  const { resolved, refId, payload } = layer.directive;

  if (resolved !== undefined) {
    return resolved;
  }

  if (refId !== undefined) {
    return refId;
  }

  if (payload && Object.keys(payload).length > 0) {
    return payload;
  }

  return layer.key;
};

const pickHighestPriorityLayer = (
  layers: Record<string, PresentationLayer> | undefined,
): PresentationLayer | undefined => {
  if (!layers) {
    return undefined;
  }

  const entries = Object.entries(layers);
  if (entries.length === 0) {
    return undefined;
  }

  return entries
    .map(([, layer]) => layer)
    .sort((first, second) => {
      if (first.priority === second.priority) {
        return first.key.localeCompare(second.key);
      }

      return second.priority - first.priority;
    })[0];
};

const toTemplateInputs = (frame: Frame): Record<TemplateInputKey, unknown> => {
  const inputs: Partial<Record<TemplateInputKey, unknown>> = {};
  const presentation: PresentationState | undefined = frame.presentation;

  if (frame.content) {
    inputs[TEMPLATE_INPUT_KEY.NODE_DIALOGUE] = frame.content;
  }

  if (frame.speaker) {
    inputs[TEMPLATE_INPUT_KEY.NODE_SPEAKER] = frame.speaker;
  }

  if (presentation?.background) {
    inputs[TEMPLATE_INPUT_KEY.NODE_BACKGROUND] = resolvePresentationValue(presentation.background);
  }

  const portraitLayer = pickHighestPriorityLayer(presentation?.portraits);
  const overlayLayer = pickHighestPriorityLayer(presentation?.overlays);
  const imageLayer = portraitLayer ?? overlayLayer;

  if (imageLayer) {
    inputs[TEMPLATE_INPUT_KEY.NODE_IMAGE] = resolvePresentationValue(imageLayer);
  }

  return inputs as Record<TemplateInputKey, unknown>;
};

export const framesToTemplateInputs = (frames: Frame[]): FrameTemplateInputs[] =>
  frames.map((frame) => ({
    frameId: frame.id,
    kind: frame.kind,
    source: frame.source,
    inputs: toTemplateInputs(frame),
  }));
