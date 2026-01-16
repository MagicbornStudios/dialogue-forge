/**
 * Hook to register Forge graph editor actions with CopilotKit
 * 
 * This hook must be used within the editor component tree where
 * ForgeEditorActions are available via context.
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import { useReactFlow } from 'reactflow';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { createForgeGraphEditorActions } from '../actions/editor/forge-graph-editor-actions';

export function useForgeGraphEditorActions() {
  const editorActions = useForgeEditorActions();
  const reactFlow = useReactFlow();

  const actions = useMemo(
    () => createForgeGraphEditorActions(editorActions, reactFlow),
    [editorActions, reactFlow]
  );

  // Register each action with CopilotKit
  actions.forEach((action) => {
    useCopilotAction(action);
  });
}
