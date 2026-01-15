import type { StateCreator } from 'zustand';
import type { AiWorkspaceState } from '../ai-workspace-types';

export interface ConfigSlice {
  apiKey: string | null;
  selectedModel: string;
  configError: string | null;
}

export interface ConfigActions {
  setApiKey: (key: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  setConfigError: (error: string | null) => void;
}

export function createConfigSlice(
  set: Parameters<StateCreator<AiWorkspaceState, [], [], AiWorkspaceState>>[0],
  get: Parameters<StateCreator<AiWorkspaceState, [], [], AiWorkspaceState>>[1],
  dataAdapter?: import('@/ai/adapters/types/ai-data-adapter').AiDataAdapter
): ConfigSlice & ConfigActions {
  return {
    apiKey: null,
    selectedModel: 'openrouter/anthropic/claude-3.5-sonnet',
    configError: null,
    setApiKey: async (key: string) => {
      try {
        if (dataAdapter) {
          await dataAdapter.setApiKey(key);
        }
        set({ apiKey: key, configError: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set API key';
        set({ configError: message });
      }
    },
    setSelectedModel: (model: string) => set({ selectedModel: model }),
    setConfigError: (error: string | null) => set({ configError: error }),
  };
}
