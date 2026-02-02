/**
 * Hook to register Video workspace actions with CopilotKit
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { VideoWorkspaceState } from '@/video/workspace/store/video-workspace-store';

export function useVideoWorkspaceActions(
  workspaceStore: StoreApi<VideoWorkspaceState>
) {
  // Register actions with CopilotKit
  useCopilotAction({
    name: 'video_get_current_template',
    description: 'Get the currently active video template being edited',
    handler: async () => {
      const state = workspaceStore.getState();
      const template = state.draftGraph;
      
      if (!template) {
        return { message: 'No template currently loaded' };
      }
      
      return {
        template: {
          id: template.id,
          name: template.name,
          width: template.width,
          height: template.height,
          frameRate: template.frameRate,
          sceneCount: template.scenes.length,
          layerCount: template.scenes.reduce((sum, s) => sum + s.layers.length, 0),
        },
      };
    },
  });

  useCopilotAction({
    name: 'video_list_templates',
    description: 'List all video templates in the current project',
    handler: async () => {
      const state = workspaceStore.getState();
      const adapter = state.adapter;
      
      if (!adapter) {
        return { message: 'No adapter available' };
      }
      
      try {
        const templates = await adapter.listTemplates();
        return { templates };
      } catch (error) {
        return { error: 'Failed to list templates' };
      }
    },
  });

  useCopilotAction({
    name: 'video_add_layer',
    description: 'Add a new layer to the current template',
    parameters: [
      {
        name: 'kind',
        type: 'string',
        description: 'Layer type: text, rectangle, circle, image, video, background',
        required: true,
      },
      {
        name: 'content',
        type: 'string',
        description: 'Text content (for text layers)',
      },
      {
        name: 'x',
        type: 'number',
        description: 'X position (default: center)',
      },
      {
        name: 'y',
        type: 'number',
        description: 'Y position (default: center)',
      },
      {
        name: 'width',
        type: 'number',
        description: 'Width in pixels',
      },
      {
        name: 'height',
        type: 'number',
        description: 'Height in pixels',
      },
    ],
    handler: async ({ kind, content, x, y, width, height }) => {
      const state = workspaceStore.getState();
      const template = state.draftGraph;
      
      if (!template) {
        return { error: 'No template loaded' };
      }
      
      const newLayer = {
        id: `layer_${Date.now()}`,
        name: `${kind} Layer`,
        kind: kind as any,
        startMs: 0,
        durationMs: 1000, // 1 second default
        opacity: 1,
        visual: {
          x: x ?? 960,
          y: y ?? 540,
          width: width ?? (kind === 'text' ? 400 : 200),
          height: height ?? (kind === 'text' ? 100 : 200),
          rotation: 0,
          scale: 1,
          anchorX: 0, // Top-left corner
          anchorY: 0,
        },
        style: {
          fontSize: 32,
          fontFamily: 'system-ui',
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center' as const,
          backgroundColor: kind === 'text' ? 'transparent' : '#3b82f6',
        },
        inputs: content ? { content } : undefined,
      };
      
      state.actions.addLayer(newLayer);
      
      return { success: true, layerId: newLayer.id };
    },
  });

  useCopilotAction({
    name: 'video_update_layer',
    description: 'Update properties of a layer by ID',
    parameters: [
      {
        name: 'layerId',
        type: 'string',
        description: 'ID of the layer to update',
        required: true,
      },
      {
        name: 'updates',
        type: 'object',
        description: 'Properties to update (visual, style, inputs)',
        required: true,
      },
    ],
    handler: async ({ layerId, updates }) => {
      const state = workspaceStore.getState();
      state.actions.updateLayer(layerId, updates);
      
      return { success: true };
    },
  });

  useCopilotAction({
    name: 'video_generate_background',
    description: 'Generate an AI background image for the template (placeholder - not implemented)',
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        description: 'Description of the background to generate',
        required: true,
      },
    ],
    handler: async ({ prompt }) => {
      return { 
        message: `Background generation will use: ${prompt}. Implementation coming soon with AI models.`
      };
    },
  });
}
