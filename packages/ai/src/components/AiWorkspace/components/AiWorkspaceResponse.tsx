import React from 'react';
import { useAiWorkspaceStore } from '../store/ai-workspace-store';

export function AiWorkspaceResponse() {
  const currentResponse = useAiWorkspaceStore((state) => state.currentResponse);
  const isStreaming = useAiWorkspaceStore((state) => state.isStreaming);
  const responseError = useAiWorkspaceStore((state) => state.responseError);

  return (
    <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-4">
      <h3 className="text-sm font-semibold text-df-text-primary mb-3">Response</h3>
      
      <div className="space-y-2">
        {isStreaming && (
          <div className="text-sm text-df-text-secondary">Streaming response...</div>
        )}
        
        {responseError && (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
            {responseError}
          </div>
        )}
        
        {currentResponse && !isStreaming && (
          <div className="space-y-2">
            {currentResponse.model && (
              <div className="text-xs text-df-text-tertiary">
                Model: {currentResponse.model}
              </div>
            )}
            <pre className="rounded-md border border-df-control-border bg-df-control-bg p-3 text-xs text-df-text-primary whitespace-pre-wrap max-h-96 overflow-auto">
              {currentResponse.content}
            </pre>
          </div>
        )}
        
        {!currentResponse && !isStreaming && !responseError && (
          <div className="text-sm text-df-text-tertiary">
            No response yet. Send a request to get started.
          </div>
        )}
      </div>
    </div>
  );
}
