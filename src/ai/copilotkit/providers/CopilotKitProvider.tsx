'use client';

import React, { useState, createContext, useContext } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';

interface CopilotKitProviderProps {
  children: React.ReactNode;
  instructions?: string;
  defaultOpen?: boolean;
}

// Context to control sidebar visibility
const CopilotSidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export function useCopilotSidebar() {
  const context = useContext(CopilotSidebarContext);
  if (!context) {
    throw new Error('useCopilotSidebar must be used within CopilotKitProvider');
  }
  return context;
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
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // publicApiKey is optional when using self-hosted runtime
  // If provided, it's used for CopilotKit Cloud features
  const publicApiKey = process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY;
  
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      {...(publicApiKey ? { publicApiKey } : {})}
    >
      <CopilotSidebarContext.Provider value={{ isOpen, setIsOpen }}>
        {children}
        {/* Only render sidebar when it should be open to avoid DOM issues */}
        {isOpen && (
          <CopilotSidebar
            key={`sidebar-${isOpen}`}
            instructions={instructions}
            defaultOpen={true}
          />
        )}
      </CopilotSidebarContext.Provider>
    </CopilotKit>
  );
}
