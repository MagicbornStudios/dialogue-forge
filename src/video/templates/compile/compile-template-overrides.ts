import type { Frame } from '@/forge/runtime/types';
import type { VideoComposition } from '@/video/templates/types/video-composition';
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

export interface VideoTemplateCompileResult {
  composition: VideoComposition;
  resolvedBindings: FrameTemplateInputs[];
}

const mergeInputs = (
  baseInputs: Record<string, unknown>,
  templateOverrides: Partial<Record<string, unknown>> | undefined,
  frameOverrides: Partial<Record<string, unknown>> | undefined,
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
): VideoTemplateCompileResult => {
  const baseFrameInputs = framesToTemplateInputs(payload.frames);
  const resolvedBindings = applyOverrides(baseFrameInputs, payload.overrides);
  const composition = compileCompositionFromFrames(template, payload.frames, {
    ...(payload.options ?? {}),
    frameInputs: resolvedBindings,
  });

  return {
    composition,
    resolvedBindings,
  };
};
