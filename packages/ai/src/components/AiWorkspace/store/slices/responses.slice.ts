import type { StateCreator } from 'zustand';
import type { AiWorkspaceState } from '../ai-workspace-types';

export interface ResponsesSlice {
  currentResponse: AiResponse | null;
  isStreaming: boolean;
  responseHistory: AiResponse[];
  responseError: string | null;
}

export interface ResponsesActions {
  setCurrentResponse: (response: AiResponse | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  addResponseToHistory: (response: AiResponse) => void;
  clearResponseHistory: () => void;
  setResponseError: (error: string | null) => void;
}

export interface AiResponse {
  id: string;
  timestamp: number;
  content: string;
  model?: string;
}

export function createResponsesSlice(
  set: Parameters<StateCreator<AiWorkspaceState, [], [], AiWorkspaceState>>[0],
  get: Parameters<StateCreator<AiWorkspaceState, [], [], AiWorkspaceState>>[1]
): ResponsesSlice & ResponsesActions {
  return {
    currentResponse: null,
    isStreaming: false,
    responseHistory: [],
    responseError: null,
    setCurrentResponse: (response) => set({ currentResponse: response }),
    setIsStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
    addResponseToHistory: (response) =>
      set((state) => ({
        responseHistory: [response, ...state.responseHistory].slice(0, 50), // Keep last 50
      })),
    clearResponseHistory: () => set({ responseHistory: [] }),
    setResponseError: (error: string | null) => set({ responseError: error }),
  };
}
