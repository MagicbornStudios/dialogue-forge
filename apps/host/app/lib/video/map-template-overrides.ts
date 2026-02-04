import {
  TEMPLATE_INPUT_KEY,
  type TemplateInputKey,
} from '@magicborn/shared/types/bindings';
import type { VideoTemplateOverrides } from '@magicborn/video/templates/types/video-template-overrides';

export interface VideoTemplateOverrideInputs {
  background?: string | null;
  dialogue?: string | null;
  image?: string | null;
  speaker?: string | null;
}

const applyOverride = (
  inputs: Partial<Record<TemplateInputKey, unknown>>,
  key: TemplateInputKey,
  value?: string | null,
): void => {
  if (!value) {
    return;
  }

  inputs[key] = value;
};

export const mapVideoTemplateOverrides = (
  overrides: VideoTemplateOverrideInputs,
): VideoTemplateOverrides => {
  const resolvedInputs: Partial<Record<TemplateInputKey, unknown>> = {};

  applyOverride(resolvedInputs, TEMPLATE_INPUT_KEY.NODE_BACKGROUND, overrides.background);
  applyOverride(resolvedInputs, TEMPLATE_INPUT_KEY.NODE_DIALOGUE, overrides.dialogue);
  applyOverride(resolvedInputs, TEMPLATE_INPUT_KEY.NODE_IMAGE, overrides.image);
  applyOverride(resolvedInputs, TEMPLATE_INPUT_KEY.NODE_SPEAKER, overrides.speaker);

  if (Object.keys(resolvedInputs).length === 0) {
    return {};
  }

  return {
    inputs: resolvedInputs,
  };
};
