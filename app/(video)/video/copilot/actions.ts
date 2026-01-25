import type { FrontendAction } from '@copilotkit/react-core';
import type { Parameter } from '@copilotkit/shared';

export const VIDEO_WORKSPACE_ACTION = {
  ADD_SCENE: 'video.workspace.addScene',
  DELETE_LAYER: 'video.workspace.deleteLayer',
  SET_DURATION: 'video.workspace.setDuration',
  RENAME_TEMPLATE: 'video.workspace.renameTemplate',
  LOAD_PRESET: 'video.workspace.loadPreset',
  EXPORT: 'video.workspace.export',
} as const;

export type VideoWorkspaceActionName = (typeof VIDEO_WORKSPACE_ACTION)[keyof typeof VIDEO_WORKSPACE_ACTION];

export type VideoWorkspaceDurationTarget = 'scene' | 'layer';

export interface VideoWorkspaceActionHandlers {
  addScene: (options?: { durationMs?: number }) => void;
  deleteLayer: (layerId: string) => void;
  setDuration: (payload: { durationMs: number; target?: VideoWorkspaceDurationTarget; id?: string }) => void;
  renameTemplate: (name: string) => void;
  loadPreset: (presetId: string) => void;
  exportVideo: () => void | Promise<void>;
}

export function createVideoWorkspaceActions(
  handlers: VideoWorkspaceActionHandlers
): [
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
    deleteLayerAction,
    setDurationAction,
    renameTemplateAction,
    loadPresetAction,
    exportAction,
  ];
}
