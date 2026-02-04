/**
 * Hook to register Writer workspace actions with CopilotKit
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';
import { createWriterWorkspaceActions } from '../actions/workspace/writer-workspace-actions';

export function useWriterWorkspaceActions(
  workspaceStore: StoreApi<WriterWorkspaceState>
) {
  const actions = useMemo(
    () => createWriterWorkspaceActions(workspaceStore),
    [workspaceStore]
  );

  // Register each action with CopilotKit
  // Hooks must be called at the top level, not inside loops
  const [proposeTextEditAction, getCurrentPageAction, listPagesAction, switchPageAction] = actions;
  
  useCopilotAction(proposeTextEditAction);
  useCopilotAction(getCurrentPageAction);
  useCopilotAction(listPagesAction);
  useCopilotAction(switchPageAction);
}
