// src/components/AiWorkspace/AiWorkspace.tsx
import React, { useRef } from 'react';
import type { AiDataAdapter } from '@/ai/adapters/types/ai-data-adapter';
import {
  AiWorkspaceStoreProvider,
  createAiWorkspaceStore,
  useAiWorkspaceStore,
} from './store/ai-workspace-store';
import { AiWorkspaceConfig } from './components/AiWorkspaceConfig';
import { AiWorkspaceRequest } from './components/AiWorkspaceRequest';
import { AiWorkspaceResponse } from './components/AiWorkspaceResponse';
import { AiWorkspaceHistory } from './components/AiWorkspaceHistory';

interface AiWorkspaceProps {
  dataAdapter?: AiDataAdapter;
  className?: string;
}

export function AiWorkspace({ dataAdapter, className = '' }: AiWorkspaceProps) {
  const storeRef = useRef(
    createAiWorkspaceStore({
      dataAdapter,
    })
  );

  return (
    <AiWorkspaceStoreProvider store={storeRef.current}>
      <AiWorkspaceContent className={className} />
    </AiWorkspaceStoreProvider>
  );
}

function AiWorkspaceContent({ className = '' }: { className?: string }) {
  const currentRequest = useAiWorkspaceStore((state) => state.currentRequest);
  const currentResponse = useAiWorkspaceStore((state) => state.currentResponse);
  const isStreaming = useAiWorkspaceStore((state) => state.isStreaming);

  const isFocused = Boolean(currentRequest) || isStreaming;
  const contextNodeType = currentResponse ? 'response' : currentRequest ? 'request' : undefined;

  return (
    <div
      className={`flex h-full w-full flex-col gap-4 p-4 ${className}`}
      data-domain="ai"
      data-editor-scope="ai"
      data-context-node-type={contextNodeType}
      data-focused={isFocused ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-df-text-primary">AI Workspace</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <AiWorkspaceConfig />
          <AiWorkspaceRequest />
        </div>
        <div className="space-y-4">
          <AiWorkspaceResponse />
          <AiWorkspaceHistory />
        </div>
      </div>
    </div>
  );
}
