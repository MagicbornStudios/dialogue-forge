'use client';

import React from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { useCopilotKitActions } from '@/ai/copilotkit/hooks/useCopilotKitActions';

interface CopilotKitActionsProviderProps {
  workspaceStore: StoreApi<WriterWorkspaceState>;
}

export function CopilotKitActionsProvider({
  workspaceStore,
}: CopilotKitActionsProviderProps) {
  useCopilotKitActions(workspaceStore);
  return null;
}
