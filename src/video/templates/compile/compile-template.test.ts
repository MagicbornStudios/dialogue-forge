import { describe, expect, it } from 'vitest';

import { TEMPLATE_INPUT_KEY } from '../../../shared/types/bindings';
import { VIDEO_LAYER_COMPONENT, VIDEO_LAYER_KIND } from '../types/video-layer';
import type { VideoTemplate } from '../types/video-template';
import { compileTemplate } from './compile-template';

describe('compileTemplate', () => {
  it('returns deterministic ordering for layers and resolved inputs', () => {
    const template: VideoTemplate = {
      id: 'template-1',
      name: 'Demo',
      width: 1920,
      height: 1080,
      frameRate: 30,
      inputs: {
        speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
        dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
      },
      scenes: [
        {
          id: 'scene-1',
          name: 'Intro',
          durationMs: 3000,
          inputs: {
            background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
          },
          layers: [
            {
              id: 'layer-b',
              kind: VIDEO_LAYER_KIND.PORTRAIT,
              startMs: 500,
              durationMs: 1000,
              inputs: {
                image: TEMPLATE_INPUT_KEY.NODE_IMAGE,
              },
            },
            {
              id: 'layer-a',
              kind: VIDEO_LAYER_KIND.PORTRAIT,
              startMs: 500,
              durationMs: 1000,
              inputs: {
                image: TEMPLATE_INPUT_KEY.NODE_IMAGE,
              },
            },
          ],
        },
      ],
    };

    const composition = compileTemplate(template, {
      [TEMPLATE_INPUT_KEY.NODE_BACKGROUND]: 'bg.png',
      [TEMPLATE_INPUT_KEY.NODE_DIALOGUE]: 'hello',
      [TEMPLATE_INPUT_KEY.NODE_IMAGE]: 'actor.png',
      [TEMPLATE_INPUT_KEY.NODE_SPEAKER]: 'Avery',
    });

    const scene = composition.scenes[0];
    expect(scene.layers.map((layer) => layer.id)).toEqual(['layer-a', 'layer-b']);
    expect(scene.layers[0].component).toBe(VIDEO_LAYER_COMPONENT.PORTRAIT);

    const resolvedInputs = scene.layers[0].resolvedInputs;
    expect(resolvedInputs).toEqual({
      dialogue: 'hello',
      speaker: 'Avery',
      background: 'bg.png',
      image: 'actor.png',
    });
    expect(Object.keys(resolvedInputs ?? {})).toEqual([
      'dialogue',
      'speaker',
      'background',
      'image',
    ]);
  });

  it('throws when bindings are missing', () => {
    const template: VideoTemplate = {
      id: 'template-2',
      name: 'Missing',
      width: 1280,
      height: 720,
      frameRate: 24,
      scenes: [
        {
          id: 'scene-1',
          durationMs: 1000,
          inputs: {
            background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
          },
          layers: [],
        },
      ],
    };

    expect(() => compileTemplate(template, {})).toThrowError(
      `Missing template inputs: ${TEMPLATE_INPUT_KEY.NODE_BACKGROUND}`,
    );
  });
});
