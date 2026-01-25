import { useMemo } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { createVideoWorkspaceActions } from './actions';
import type { VideoWorkspaceActionHandlers } from './actions';

export function useVideoWorkspaceActions(handlers: VideoWorkspaceActionHandlers) {
  const actions = useMemo(() => createVideoWorkspaceActions(handlers), [handlers]);

  const [
    addSceneAction,
    deleteLayerAction,
    setDurationAction,
    renameTemplateAction,
    loadPresetAction,
    exportAction,
  ] = actions;

  useCopilotAction(addSceneAction);
  useCopilotAction(deleteLayerAction);
  useCopilotAction(setDurationAction);
  useCopilotAction(renameTemplateAction);
  useCopilotAction(loadPresetAction);
  useCopilotAction(exportAction);
}
