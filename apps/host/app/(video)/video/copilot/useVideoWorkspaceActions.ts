import { useMemo } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { createVideoWorkspaceActions } from './actions';
import type { VideoWorkspaceActionHandlers } from './actions';

export function useVideoWorkspaceActions(handlers: VideoWorkspaceActionHandlers) {
  const actions = useMemo(() => createVideoWorkspaceActions(handlers), [handlers]);

  const [
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
  ] = actions;

  useCopilotAction(addSceneAction);
  useCopilotAction(addLayerAction);
  useCopilotAction(deleteSceneAction);
  useCopilotAction(deleteLayerAction);
  useCopilotAction(duplicateSceneAction);
  useCopilotAction(updateLayerTimingAction);
  useCopilotAction(updateLayerOpacityAction);
  useCopilotAction(bindLayerInputAction);
  useCopilotAction(setDurationAction);
  useCopilotAction(setTemplateMetadataAction);
  useCopilotAction(renameTemplateAction);
  useCopilotAction(loadPresetAction);
  useCopilotAction(exportAction);
}
