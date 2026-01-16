'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { CopilotKitContextProvider } from '@/ai/copilotkit/providers/CopilotKitContextProvider';
import { CopilotKitActionsProvider } from '@/ai/copilotkit/providers/CopilotKitActionsProvider';

interface CopilotKitWorkspaceProviderProps {
  workspaceStore: StoreApi<WriterWorkspaceState>;
  children: React.ReactNode;
}

export function CopilotKitWorkspaceProvider({
  workspaceStore,
  children,
}: CopilotKitWorkspaceProviderProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
    >
      <CopilotKitContextProvider workspaceStore={workspaceStore} />
      <CopilotKitActionsProvider workspaceStore={workspaceStore} />
      {children}
      <CopilotSidebar
        instructions="You are an AI assistant for the Writer workspace. Help users edit and improve their writing."
        defaultOpen={false}
      />
    </CopilotKit>
  );
}
