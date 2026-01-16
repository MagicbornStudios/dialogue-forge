/**
 * Hook to register Forge workspace actions with CopilotKit
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { ForgeWorkspaceState } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { createForgeWorkspaceActions } from '../actions/workspace/forge-workspace-actions';

export function useForgeWorkspaceActions(
  workspaceStore: StoreApi<ForgeWorkspaceState>
) {
  const actions = useMemo(
    () => createForgeWorkspaceActions(workspaceStore),
    [workspaceStore]
  );

  // Register each action with CopilotKit
  // Hooks must be called at the top level, not inside loops
  const [
    getCurrentGraphAction,
    listGraphsAction,
    switchGraphAction,
    getFlagSchemaAction,
    getGameStateAction,
    getChaptersAction,
    getActsAction,
    getPagesAction,
    getGraphAction,
  ] = actions;
  
  useCopilotAction(getCurrentGraphAction);
  useCopilotAction(listGraphsAction);
  useCopilotAction(switchGraphAction);
  useCopilotAction(getFlagSchemaAction);
  useCopilotAction(getGameStateAction);
  useCopilotAction(getChaptersAction);
  useCopilotAction(getActsAction);
  useCopilotAction(getPagesAction);
  useCopilotAction(getGraphAction);
}
