'use client';

import React from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { useWriterWorkspaceActions } from '@/writer/copilotkit';

interface CopilotKitActionsProviderProps {
  workspaceStore: StoreApi<WriterWorkspaceState>;
}

/**
 * @deprecated This provider is kept for backward compatibility.
 * Actions are now registered directly in workspace components.
 * This will be removed in a future version.
 */
export function CopilotKitActionsProvider({
  workspaceStore,
}: CopilotKitActionsProviderProps) {
  useWriterWorkspaceActions(workspaceStore);
  return null;
}
