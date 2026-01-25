import type { Frame } from '@/forge/runtime/types';
import { TEMPLATE_INPUT_KEY, type TemplateInputKey } from '@/shared/types/bindings';
import type { VideoComposition } from '@/video/templates/types/video-composition';
import type { VideoTemplateInputOverrides } from '@/video/templates/types/video-template-input-overrides';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateOverrides } from '@/video/templates/types/video-template-overrides';
import type { FrameTemplateInputs } from './frames-to-template-inputs';
import { framesToTemplateInputs } from './frames-to-template-inputs';
import { compileCompositionFromFrames, type CompileCompositionOptions } from './compile-composition';

export interface VideoTemplateCompilePayload {
  frames: Frame[];
  overrides?: VideoTemplateOverrides;
  options?: CompileCompositionOptions;
}

export interface VideoTemplateCompileResultWithOverrides {
  composition: VideoComposition;
  bindingMap: FrameTemplateInputs[];
}

const templateInputKeys = new Set(Object.values(TEMPLATE_INPUT_KEY));

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const validateInputOverrides = (overrides: VideoTemplateInputOverrides, context: string): void => {
  const invalidKeys = Object.keys(overrides).filter((key) => !templateInputKeys.has(key as TemplateInputKey));

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid template input override keys in ${context}: ${invalidKeys.sort().join(', ')}`);
  }
};

const validateOverrides = (overrides: VideoTemplateOverrides | undefined): void => {
  if (!overrides) {
    return;
  }

  if (overrides.inputs !== undefined) {
    if (!isRecord(overrides.inputs)) {
      throw new Error('Invalid template input overrides: inputs must be an object.');
    }
    validateInputOverrides(overrides.inputs, 'template inputs');
  }

  if (overrides.frameInputs !== undefined) {
    if (!isRecord(overrides.frameInputs)) {
      throw new Error('Invalid template input overrides: frameInputs must be an object.');
    }

    Object.entries(overrides.frameInputs).forEach(([frameId, frameOverrides]) => {
      if (!isRecord(frameOverrides)) {
        throw new Error(`Invalid template input overrides for frame "${frameId}": expected an object.`);
      }
      validateInputOverrides(frameOverrides, `frame "${frameId}"`);
    });
  }
};

const mergeInputs = (
  baseInputs: Record<string, unknown>,
  templateOverrides: VideoTemplateInputOverrides | undefined,
  frameOverrides: VideoTemplateInputOverrides | undefined,
): Record<string, unknown> => {
  if (!templateOverrides && !frameOverrides) {
    return baseInputs;
  }

  return {
    ...baseInputs,
    ...(templateOverrides ?? {}),
    ...(frameOverrides ?? {}),
  };
};

const applyOverrides = (
  frameInputs: FrameTemplateInputs[],
  overrides: VideoTemplateOverrides | undefined,
): FrameTemplateInputs[] => {
  if (!overrides?.inputs && !overrides?.frameInputs) {
    return frameInputs;
  }

  return frameInputs.map((frameInput) => {
    const frameOverride = overrides.frameInputs?.[frameInput.frameId];

    return {
      ...frameInput,
      inputs: mergeInputs(frameInput.inputs, overrides.inputs, frameOverride),
    };
  });
};

export const compileTemplateWithOverrides = (
  template: VideoTemplate,
  payload: VideoTemplateCompilePayload,
): VideoTemplateCompileResultWithOverrides => {
  validateOverrides(payload.overrides);
  const baseFrameInputs = framesToTemplateInputs(payload.frames);
  const bindingMap = applyOverrides(baseFrameInputs, payload.overrides);
  const composition = compileCompositionFromFrames(template, payload.frames, {
    ...(payload.options ?? {}),
    frameInputs: bindingMap,
  });

  return {
    composition,
    bindingMap,
  };
};
