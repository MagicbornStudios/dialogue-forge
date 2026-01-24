import { TEMPLATE_INPUT_KEY } from '@/shared/types/bindings';
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
            startMs: 0,
            inputs: {
              background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
            },
          },
          {
            id: 'layer-dialogue',
            name: 'Dialogue',
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
            startMs: 0,
            inputs: {
              background: TEMPLATE_INPUT_KEY.NODE_BACKGROUND,
            },
          },
          {
            id: 'layer-portrait',
            name: 'Portrait Placeholder',
            startMs: 0,
            inputs: {
              image: TEMPLATE_INPUT_KEY.NODE_IMAGE,
            },
          },
          {
            id: 'layer-dialogue',
            name: 'Dialogue',
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
