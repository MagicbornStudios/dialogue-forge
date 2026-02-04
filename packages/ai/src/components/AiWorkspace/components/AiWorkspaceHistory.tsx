import React from 'react';
import { useAiWorkspaceStore } from '../store/ai-workspace-store';

export function AiWorkspaceHistory() {
  const requestHistory = useAiWorkspaceStore((state) => state.requestHistory);
  const responseHistory = useAiWorkspaceStore((state) => state.responseHistory);
  const clearRequestHistory = useAiWorkspaceStore((state) => state.actions.clearRequestHistory);
  const clearResponseHistory = useAiWorkspaceStore((state) => state.actions.clearResponseHistory);

  return (
    <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-df-text-primary">History</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearRequestHistory}
            className="text-xs text-df-text-tertiary hover:text-df-text-secondary"
          >
            Clear Requests
          </button>
          <button
            type="button"
            onClick={clearResponseHistory}
            className="text-xs text-df-text-tertiary hover:text-df-text-secondary"
          >
            Clear Responses
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-df-text-secondary mb-2">
            Requests ({requestHistory.length})
          </div>
          <div className="space-y-2 max-h-48 overflow-auto">
            {requestHistory.length === 0 ? (
              <div className="text-xs text-df-text-tertiary">No requests yet</div>
            ) : (
              requestHistory.map((req) => (
                <div
                  key={req.id}
                  className="rounded-md border border-df-control-border bg-df-control-bg p-2 text-xs"
                >
                  <div className="text-df-text-tertiary mb-1">
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </div>
                  <pre className="text-df-text-primary whitespace-pre-wrap break-words">
                    {typeof req.payload === 'string' ? req.payload : JSON.stringify(req.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-medium text-df-text-secondary mb-2">
            Responses ({responseHistory.length})
          </div>
          <div className="space-y-2 max-h-48 overflow-auto">
            {responseHistory.length === 0 ? (
              <div className="text-xs text-df-text-tertiary">No responses yet</div>
            ) : (
              responseHistory.map((resp) => (
                <div
                  key={resp.id}
                  className="rounded-md border border-df-control-border bg-df-control-bg p-2 text-xs"
                >
                  <div className="text-df-text-tertiary mb-1">
                    {new Date(resp.timestamp).toLocaleTimeString()}
                    {resp.model && ` • ${resp.model}`}
                  </div>
                  <pre className="text-df-text-primary whitespace-pre-wrap break-words">
                    {resp.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
