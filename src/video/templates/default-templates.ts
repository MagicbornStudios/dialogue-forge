// src/video/templates/default-templates.ts
import type { VideoTemplate } from '@/video/templates/types/video-template';
import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';

/**
 * Default blank template that loads automatically
 * Provides a starting point for users
 */
export const DEFAULT_BLANK_TEMPLATE: VideoTemplate = {
  id: 'default-blank-template',
  name: 'Blank Template',
  width: 1920,
  height: 1080,
  frameRate: 30,
  scenes: [
    {
      id: 'scene_1',
      name: 'Main Scene',
      durationMs: 5000,
      layers: [],
    },
  ],
};

/**
 * Simple starter template with basic elements
 * Shows users how to use the editor
 */
export const STARTER_TEMPLATE: VideoTemplate = {
  id: 'starter-template',
  name: 'Starter Template',
  width: 1920,
  height: 1080,
  frameRate: 30,
  scenes: [
    {
      id: 'scene_1',
      name: 'Main Scene',
      durationMs: 5000,
      layers: [
        {
          id: 'layer_1',
          name: 'Title',
          kind: VIDEO_LAYER_KIND.TEXT,
          startMs: 0,
          durationMs: 5000,
          opacity: 1,
          visual: {
            x: 960,
            y: 540,
            width: 800,
            height: 100,
            rotation: 0,
            scale: 1,
            anchorX: 0.5,
            anchorY: 0.5,
          },
          style: {
            fontFamily: 'system-ui',
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
          inputs: {
            content: 'Your Title Here',
          },
        },
        {
          id: 'layer_2',
          name: 'Subtitle',
          kind: VIDEO_LAYER_KIND.TEXT,
          startMs: 0,
          durationMs: 5000,
          opacity: 1,
          visual: {
            x: 960,
            y: 650,
            width: 600,
            height: 50,
            rotation: 0,
            scale: 1,
            anchorX: 0.5,
            anchorY: 0.5,
          },
          style: {
            fontFamily: 'system-ui',
            fontSize: 24,
            fontWeight: 'normal',
            color: '#ffffff',
            textAlign: 'center',
          },
          inputs: {
            content: 'Add your subtitle here',
          },
        },
      ],
    },
  ],
};

/**
 * Hero banner template for social media
 * Professional design with background
 */
export const HERO_BANNER_TEMPLATE: VideoTemplate = {
  id: 'hero-banner-template',
  name: 'Hero Banner',
  description: 'Professional hero banner template',
  width: 1920,
  height: 1080,
  frameRate: 30,
  scenes: [
    {
      id: 'scene_1',
      name: 'Hero Scene',
      durationMs: 5000,
      layers: [
        {
          id: 'layer_1',
          name: 'Background',
          kind: VIDEO_LAYER_KIND.BACKGROUND,
          startMs: 0,
          durationMs: 5000,
          opacity: 1,
          visual: {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            rotation: 0,
            scale: 1,
          },
          style: {
            backgroundColor: '#3b82f6',
          },
        },
        {
          id: 'layer_2',
          name: 'Main Title',
          kind: VIDEO_LAYER_KIND.TEXT,
          startMs: 0,
          durationMs: 5000,
          opacity: 1,
          visual: {
            x: 960,
            y: 540,
            width: 1200,
            height: 150,
            rotation: 0,
            scale: 1,
            anchorX: 0.5,
            anchorY: 0.5,
          },
          style: {
            fontFamily: 'system-ui',
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
          inputs: {
            content: 'Hero Title',
          },
        },
      ],
    },
  ],
};

/**
 * All available templates for quick access
 */
export const AVAILABLE_TEMPLATES = {
  blank: DEFAULT_BLANK_TEMPLATE,
  starter: STARTER_TEMPLATE,
  hero: HERO_BANNER_TEMPLATE,
};

/**
 * Default template to load automatically
 */
export const DEFAULT_TEMPLATE = DEFAULT_BLANK_TEMPLATE;