'use client';

import React from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { useCopilotKitContext } from '@/ai/copilotkit/hooks/useCopilotKitContext';

interface CopilotKitContextProviderProps {
  workspaceStore: StoreApi<WriterWorkspaceState>;
}

export function CopilotKitContextProvider({
  workspaceStore,
}: CopilotKitContextProviderProps) {
  useCopilotKitContext(workspaceStore);
  return null;
}
