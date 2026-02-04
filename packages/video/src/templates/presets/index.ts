import { TEMPLATE_INPUT_KEY } from '@magicborn/shared/types/bindings';
import { VIDEO_LAYER_KIND } from '../types/video-layer';
import type { VideoTemplate } from '../types/video-template';

export const VIDEO_TEMPLATE_PRESETS: VideoTemplate[] = [
  {
    id: 'preset-dialogue-only',
    name: 'Dialogue Only',
    width: 1920,
    height: 1080,
    frameRate: 30,
    inputs: {
      speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
      dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
    },
    scenes: [
      {
        id: 'scene-dialogue-only',
        name: 'Dialogue Scene',
        durationMs: 4000,
        inputs: {
          background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
        },
        layers: [
          {
            id: 'layer-background',
            name: 'Background',
            kind: VIDEO_LAYER_KIND.BACKGROUND,
            startMs: 0,
            inputs: {
              background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
            },
          },
          {
            id: 'layer-dialogue',
            name: 'Dialogue',
            kind: VIDEO_LAYER_KIND.DIALOGUE_CARD,
            startMs: 0,
            inputs: {
              dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
              speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'preset-dialogue-portrait',
    name: 'Dialogue + Portrait Placeholder',
    width: 1920,
    height: 1080,
    frameRate: 30,
    inputs: {
      speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
      dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
    },
    scenes: [
      {
        id: 'scene-dialogue-portrait',
        name: 'Dialogue Scene',
        durationMs: 4000,
        inputs: {
          background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
        },
        layers: [
          {
            id: 'layer-background',
            name: 'Background',
            kind: VIDEO_LAYER_KIND.BACKGROUND,
            startMs: 0,
            inputs: {
              background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
            },
          },
          {
            id: 'layer-portrait',
            name: 'Portrait Placeholder',
            kind: VIDEO_LAYER_KIND.PORTRAIT,
            startMs: 0,
            inputs: {
              image: TEMPLATE_INPUT_KEY.NODE_IMAGE,
            },
          },
          {
            id: 'layer-dialogue',
            name: 'Dialogue',
            kind: VIDEO_LAYER_KIND.DIALOGUE_CARD,
            startMs: 0,
            inputs: {
              dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
              speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'preset-dialogue-lower-third',
    name: 'Dialogue + Lower Third',
    width: 1920,
    height: 1080,
    frameRate: 30,
    inputs: {
      speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
      dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
    },
    scenes: [
      {
        id: 'scene-dialogue-lower-third',
        name: 'Dialogue Scene',
        durationMs: 5000,
        inputs: {
          background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
        },
        layers: [
          {
            id: 'layer-background',
            name: 'Background',
            kind: VIDEO_LAYER_KIND.BACKGROUND,
            startMs: 0,
            inputs: {
              background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
            },
          },
          {
            id: 'layer-portrait',
            name: 'Portrait',
            kind: VIDEO_LAYER_KIND.PORTRAIT,
            startMs: 0,
            inputs: {
              image: TEMPLATE_INPUT_KEY.NODE_IMAGE,
            },
          },
          {
            id: 'layer-lower-third',
            name: 'Lower Third',
            kind: VIDEO_LAYER_KIND.LOWER_THIRD,
            startMs: 200,
            inputs: {
              speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
            },
          },
          {
            id: 'layer-dialogue',
            name: 'Dialogue Card',
            kind: VIDEO_LAYER_KIND.DIALOGUE_CARD,
            startMs: 0,
            inputs: {
              dialogue: TEMPLATE_INPUT_KEY.NODE_DIALOGUE,
              speaker: TEMPLATE_INPUT_KEY.NODE_SPEAKER,
            },
          },
        ],
      },
    ],
  },
];

export const VIDEO_TEMPLATE_PRESET_BY_ID = Object.fromEntries(
  VIDEO_TEMPLATE_PRESETS.map((preset) => [preset.id, preset]),
);
