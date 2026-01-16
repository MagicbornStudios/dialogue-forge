/**
 * Hook to register Writer editor actions with CopilotKit
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import { createWriterEditorActions } from '../actions/editor/writer-editor-actions';

export function useWriterEditorActions() {
  const actions = useMemo(() => createWriterEditorActions(), []);

  // Register each action with CopilotKit
  actions.forEach((action) => {
    useCopilotAction(action);
  });
}
