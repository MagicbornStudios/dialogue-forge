'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';

interface CopilotKitProviderProps {
  children: React.ReactNode;
  instructions?: string;
  defaultOpen?: boolean;
}

/**
 * Generic CopilotKit provider that can be used by any workspace.
 * Context and actions should be provided by workspace-specific components.
 */
export function CopilotKitProvider({
  children,
  instructions = 'You are an AI assistant. Help users with their tasks.',
  defaultOpen = false,
}: CopilotKitProviderProps) {
  // publicApiKey is optional when using self-hosted runtime
  // If provided, it's used for CopilotKit Cloud features
  const publicApiKey = process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY;
  
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      {...(publicApiKey ? { publicApiKey } : {})}
    >
      {children}
      <CopilotSidebar
        instructions={instructions}
        defaultOpen={defaultOpen}
      />
    </CopilotKit>
  );
}
