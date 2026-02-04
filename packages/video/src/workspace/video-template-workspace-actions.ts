export const VIDEO_TEMPLATE_WORKSPACE_ACTION = {
  NEW_TEMPLATE: 'video.template.new',
  OPEN_TEMPLATE: 'video.template.open',
  SAVE_TEMPLATE: 'video.template.save',
  DUPLICATE_SCENE: 'video.scene.duplicate',
  ADD_SCENE: 'video.scene.add',
  ADD_LAYER: 'video.layer.add',
  DELETE_LAYER: 'video.layer.delete',
  TOGGLE_PREVIEW_PLAYBACK: 'video.preview.toggle-playback',
} as const;

export type VideoTemplateWorkspaceActionName =
  (typeof VIDEO_TEMPLATE_WORKSPACE_ACTION)[keyof typeof VIDEO_TEMPLATE_WORKSPACE_ACTION];

export interface VideoTemplateWorkspaceCommand {
  id: VideoTemplateWorkspaceActionName;
  label: string;
  description: string;
  shortcut?: string;
}

export const VIDEO_TEMPLATE_WORKSPACE_COMMANDS: VideoTemplateWorkspaceCommand[] = [
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.NEW_TEMPLATE,
    label: 'New template',
    description: 'Create a new video template',
    shortcut: 'Mod+N',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.OPEN_TEMPLATE,
    label: 'Open template',
    description: 'Open an existing video template',
    shortcut: 'Mod+O',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.SAVE_TEMPLATE,
    label: 'Save template',
    description: 'Save changes to the current template',
    shortcut: 'Mod+S',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.ADD_SCENE,
    label: 'Add scene',
    description: 'Append a new scene to the template',
    shortcut: 'Shift+Mod+S',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.DUPLICATE_SCENE,
    label: 'Duplicate scene',
    description: 'Duplicate the active scene',
    shortcut: 'Shift+Mod+D',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.ADD_LAYER,
    label: 'Add layer',
    description: 'Create a new layer in the active scene',
    shortcut: 'Shift+Mod+L',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.DELETE_LAYER,
    label: 'Delete layer',
    description: 'Remove the selected layer',
    shortcut: 'Backspace',
  },
  {
    id: VIDEO_TEMPLATE_WORKSPACE_ACTION.TOGGLE_PREVIEW_PLAYBACK,
    label: 'Toggle playback',
    description: 'Play or pause the preview timeline',
    shortcut: 'Space',
  },
];
