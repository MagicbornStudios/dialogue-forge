import React from 'react';
import { useAiWorkspaceStore } from '../store/ai-workspace-store';

export function AiWorkspaceConfig() {
  const apiKey = useAiWorkspaceStore((state) => state.apiKey);
  const selectedModel = useAiWorkspaceStore((state) => state.selectedModel);
  const configError = useAiWorkspaceStore((state) => state.configError);
  const setApiKey = useAiWorkspaceStore((state) => state.actions.setApiKey);
  const setSelectedModel = useAiWorkspaceStore((state) => state.actions.setSelectedModel);

  const [localApiKey, setLocalApiKey] = React.useState(apiKey ?? '');

  React.useEffect(() => {
    setLocalApiKey(apiKey ?? '');
  }, [apiKey]);

  const handleSaveApiKey = async () => {
    await setApiKey(localApiKey);
  };

  return (
    <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-4">
      <h3 className="text-sm font-semibold text-df-text-primary mb-3">Configuration</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-df-text-secondary mb-1">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              className="flex-1 rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-sm text-df-text-primary outline-none"
              placeholder="Enter API key"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="rounded-md border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Save
            </button>
          </div>
          {configError && (
            <p className="mt-1 text-xs text-red-400">{configError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-df-text-secondary mb-1">
            Model
          </label>
          <select
            className="w-full rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-sm text-df-text-primary outline-none"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="openrouter/anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            <option value="openrouter/anthropic/claude-3-opus">Claude 3 Opus</option>
            <option value="openrouter/openai/gpt-4o">GPT-4o</option>
            <option value="openrouter/openai/gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>
      </div>
    </div>
  );
}
