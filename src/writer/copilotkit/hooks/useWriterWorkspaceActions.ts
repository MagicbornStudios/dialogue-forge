/**
 * Hook to register Writer workspace actions with CopilotKit
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { createWriterWorkspaceActions } from '../actions/workspace/writer-workspace-actions';

export function useWriterWorkspaceActions(
  workspaceStore: StoreApi<WriterWorkspaceState>
) {
  const actions = useMemo(
    () => createWriterWorkspaceActions(workspaceStore),
    [workspaceStore]
  );

  // Register each action with CopilotKit
  actions.forEach((action) => {
    useCopilotAction(action);
  });
}
