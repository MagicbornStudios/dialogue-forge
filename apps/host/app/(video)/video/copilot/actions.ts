import type { FrontendAction } from '@copilotkit/react-core';
import type { Parameter } from '@copilotkit/shared';
import { TEMPLATE_INPUT_KEY, type TemplateInputKey } from '@magicborn/shared/types/bindings';

export const VIDEO_WORKSPACE_ACTION = {
  ADD_SCENE: 'video.workspace.addScene',
  ADD_LAYER: 'video.workspace.addLayer',
  DELETE_SCENE: 'video.workspace.deleteScene',
  DELETE_LAYER: 'video.workspace.deleteLayer',
  DUPLICATE_SCENE: 'video.workspace.duplicateScene',
  UPDATE_LAYER_TIMING: 'video.workspace.updateLayerTiming',
  UPDATE_LAYER_OPACITY: 'video.workspace.updateLayerOpacity',
  BIND_LAYER_INPUT: 'video.workspace.bindLayerInput',
  SET_DURATION: 'video.workspace.setDuration',
  SET_TEMPLATE_METADATA: 'video.workspace.setTemplateMetadata',
  RENAME_TEMPLATE: 'video.workspace.renameTemplate',
  LOAD_PRESET: 'video.workspace.loadPreset',
  EXPORT: 'video.workspace.export',
} as const;

export type VideoWorkspaceActionName = (typeof VIDEO_WORKSPACE_ACTION)[keyof typeof VIDEO_WORKSPACE_ACTION];

export type VideoWorkspaceDurationTarget = 'scene' | 'layer';

export interface VideoWorkspaceActionHandlers {
  addScene: (options?: { durationMs?: number }) => void;
  addLayer: (options?: { sceneId?: string }) => void;
  deleteScene: (sceneId: string) => void;
  deleteLayer: (layerId: string) => void;
  duplicateScene: (sceneId: string) => void;
  updateLayerTiming: (payload: { layerId?: string; startMs?: number; durationMs?: number }) => void;
  updateLayerOpacity: (payload: { layerId?: string; opacity: number }) => void;
  bindLayerInput: (payload: { layerId?: string; inputName: string; bindingKey: TemplateInputKey }) => void;
  setDuration: (payload: { durationMs: number; target?: VideoWorkspaceDurationTarget; id?: string }) => void;
  setTemplateMetadata: (metadata: { name?: string; width?: number; height?: number; frameRate?: number }) => void;
  renameTemplate: (name: string) => void;
  loadPreset: (presetId: string) => void;
  exportVideo: () => void | Promise<void>;
}

const TEMPLATE_INPUT_KEYS = new Set<TemplateInputKey>(Object.values(TEMPLATE_INPUT_KEY));

export function createVideoWorkspaceActions(
  handlers: VideoWorkspaceActionHandlers
): [
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
  FrontendAction<Parameter[]>,
] {
  const addSceneAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.ADD_SCENE,
    description: 'Add a new scene to the current video template, optionally with a custom duration in milliseconds.',
    parameters: [
      {
        name: 'durationMs',
        type: 'number',
        description: 'Optional duration for the new scene in milliseconds.',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const durationMs = typeof args.durationMs === 'number' ? args.durationMs : undefined;
      handlers.addScene({ durationMs });
      return { success: true, durationMs };
    },
  };

  const addLayerAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.ADD_LAYER,
    description: 'Add a new layer to the current scene (or a specified scene) in the video template.',
    parameters: [
      {
        name: 'sceneId',
        type: 'string',
        description: 'Optional scene ID to add the layer into. Uses the active scene if omitted.',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const sceneId = typeof args.sceneId === 'string' && args.sceneId.trim().length > 0 ? args.sceneId : undefined;
      handlers.addLayer({ sceneId });
      return { success: true, sceneId };
    },
  };

  const deleteSceneAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.DELETE_SCENE,
    description: 'Delete a scene from the current template using the scene ID.',
    parameters: [
      {
        name: 'sceneId',
        type: 'string',
        description: 'The ID of the scene to delete.',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const sceneId = args.sceneId as string;
      if (!sceneId) {
        throw new Error('sceneId is required');
      }
      handlers.deleteScene(sceneId);
      return { success: true, sceneId };
    },
  };

  const deleteLayerAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.DELETE_LAYER,
    description: 'Delete a layer from the current template using the layer ID.',
    parameters: [
      {
        name: 'layerId',
        type: 'string',
        description: 'The ID of the layer to delete.',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const layerId = args.layerId as string;
      if (!layerId) {
        throw new Error('layerId is required');
      }
      handlers.deleteLayer(layerId);
      return { success: true, layerId };
    },
  };

  const duplicateSceneAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.DUPLICATE_SCENE,
    description: 'Duplicate a scene (including its layers) using the scene ID.',
    parameters: [
      {
        name: 'sceneId',
        type: 'string',
        description: 'The ID of the scene to duplicate.',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const sceneId = args.sceneId as string;
      if (!sceneId) {
        throw new Error('sceneId is required');
      }
      handlers.duplicateScene(sceneId);
      return { success: true, sceneId };
    },
  };

  const updateLayerTimingAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.UPDATE_LAYER_TIMING,
    description: 'Update a layer start time and/or duration in milliseconds.',
    parameters: [
      {
        name: 'layerId',
        type: 'string',
        description: 'Optional layer ID to update. Uses the active layer if omitted.',
        required: false,
      },
      {
        name: 'startMs',
        type: 'number',
        description: 'Optional start time in milliseconds.',
        required: false,
      },
      {
        name: 'durationMs',
        type: 'number',
        description: 'Optional duration in milliseconds.',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const startMs = typeof args.startMs === 'number' ? args.startMs : undefined;
      const durationMs = typeof args.durationMs === 'number' ? args.durationMs : undefined;
      if (startMs === undefined && durationMs === undefined) {
        throw new Error('startMs or durationMs is required');
      }
      const layerId = typeof args.layerId === 'string' && args.layerId.trim().length > 0 ? args.layerId : undefined;
      handlers.updateLayerTiming({ layerId, startMs, durationMs });
      return { success: true, layerId, startMs, durationMs };
    },
  };

  const updateLayerOpacityAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.UPDATE_LAYER_OPACITY,
    description: 'Update a layer opacity using a value from 0 to 1 (or 0 to 100 for percent).',
    parameters: [
      {
        name: 'layerId',
        type: 'string',
        description: 'Optional layer ID to update. Uses the active layer if omitted.',
        required: false,
      },
      {
        name: 'opacity',
        type: 'number',
        description: 'Opacity between 0 and 1 (or 0 to 100 for percent).',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const opacityValue = args.opacity as number;
      if (opacityValue === undefined || Number.isNaN(opacityValue)) {
        throw new Error('opacity is required');
      }
      const normalizedOpacity = opacityValue > 1 && opacityValue <= 100 ? opacityValue / 100 : opacityValue;
      if (normalizedOpacity < 0 || normalizedOpacity > 1 || Number.isNaN(normalizedOpacity)) {
        throw new Error('opacity must be between 0 and 1');
      }
      const layerId = typeof args.layerId === 'string' && args.layerId.trim().length > 0 ? args.layerId : undefined;
      handlers.updateLayerOpacity({ layerId, opacity: normalizedOpacity });
      return { success: true, layerId, opacity: normalizedOpacity };
    },
  };

  const bindLayerInputAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.BIND_LAYER_INPUT,
    description: 'Bind a layer input name to a template input key.',
    parameters: [
      {
        name: 'layerId',
        type: 'string',
        description: 'Optional layer ID to update. Uses the active layer if omitted.',
        required: false,
      },
      {
        name: 'inputName',
        type: 'string',
        description: 'The layer input name to bind (e.g., "image" or "background").',
        required: true,
      },
      {
        name: 'bindingKey',
        type: 'string',
        description: 'The template input key to bind (e.g., "node.background").',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const inputName = typeof args.inputName === 'string' ? args.inputName.trim() : '';
      if (!inputName) {
        throw new Error('inputName is required');
      }
      const bindingKey = args.bindingKey as TemplateInputKey;
      if (!bindingKey || !TEMPLATE_INPUT_KEYS.has(bindingKey)) {
        throw new Error('bindingKey must be a valid template input key');
      }
      const layerId = typeof args.layerId === 'string' && args.layerId.trim().length > 0 ? args.layerId : undefined;
      handlers.bindLayerInput({ layerId, inputName, bindingKey });
      return { success: true, layerId, inputName, bindingKey };
    },
  };

  const setDurationAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.SET_DURATION,
    description: 'Set the duration (in milliseconds) for a scene or layer in the active template.',
    parameters: [
      {
        name: 'durationMs',
        type: 'number',
        description: 'The duration to set in milliseconds.',
        required: true,
      },
      {
        name: 'target',
        type: 'string',
        description: 'Target type to update: "scene" or "layer". Defaults to "scene".',
        required: false,
      },
      {
        name: 'id',
        type: 'string',
        description: 'Optional scene or layer ID. Uses the active selection if omitted.',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const durationMs = args.durationMs as number;
      if (!durationMs || Number.isNaN(durationMs)) {
        throw new Error('durationMs is required');
      }
      const target = (args.target as VideoWorkspaceDurationTarget) ?? 'scene';
      const id = args.id as string | undefined;
      handlers.setDuration({ durationMs, target, id });
      return { success: true, durationMs, target, id };
    },
  };

  const setTemplateMetadataAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.SET_TEMPLATE_METADATA,
    description: 'Update template metadata such as name, width, height, or frame rate.',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Optional template name.',
        required: false,
      },
      {
        name: 'width',
        type: 'number',
        description: 'Optional template width in pixels.',
        required: false,
      },
      {
        name: 'height',
        type: 'number',
        description: 'Optional template height in pixels.',
        required: false,
      },
      {
        name: 'frameRate',
        type: 'number',
        description: 'Optional template frame rate.',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const nextMetadata: { name?: string; width?: number; height?: number; frameRate?: number } = {};
      if (typeof args.name === 'string' && args.name.trim().length > 0) {
        nextMetadata.name = args.name.trim();
      }
      if (typeof args.width === 'number' && !Number.isNaN(args.width)) {
        nextMetadata.width = Math.max(1, Math.round(args.width));
      }
      if (typeof args.height === 'number' && !Number.isNaN(args.height)) {
        nextMetadata.height = Math.max(1, Math.round(args.height));
      }
      if (typeof args.frameRate === 'number' && !Number.isNaN(args.frameRate)) {
        nextMetadata.frameRate = Math.max(1, args.frameRate);
      }
      if (Object.keys(nextMetadata).length === 0) {
        throw new Error('At least one metadata field is required');
      }
      handlers.setTemplateMetadata(nextMetadata);
      return { success: true, ...nextMetadata };
    },
  };

  const renameTemplateAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.RENAME_TEMPLATE,
    description: 'Rename the currently selected video template.',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'The new template name.',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const name = args.name as string;
      if (!name) {
        throw new Error('name is required');
      }
      handlers.renameTemplate(name);
      return { success: true, name };
    },
  };

  const loadPresetAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.LOAD_PRESET,
    description: 'Load a preset video template by its preset ID.',
    parameters: [
      {
        name: 'presetId',
        type: 'string',
        description: 'The preset template ID to load.',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const presetId = args.presetId as string;
      if (!presetId) {
        throw new Error('presetId is required');
      }
      handlers.loadPreset(presetId);
      return { success: true, presetId };
    },
  };

  const exportAction: FrontendAction<Parameter[]> = {
    name: VIDEO_WORKSPACE_ACTION.EXPORT,
    description: 'Export the current composition using the configured render settings.',
    parameters: [],
    handler: async () => {
      await handlers.exportVideo();
      return { success: true };
    },
  };

  return [
    addSceneAction,
    addLayerAction,
    deleteSceneAction,
    deleteLayerAction,
    duplicateSceneAction,
    updateLayerTimingAction,
    updateLayerOpacityAction,
    bindLayerInputAction,
    setDurationAction,
    setTemplateMetadataAction,
    renameTemplateAction,
    loadPresetAction,
    exportAction,
  ];
}
