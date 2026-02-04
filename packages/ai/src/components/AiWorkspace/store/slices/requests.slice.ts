import type { StateCreator } from 'zustand';
import type { AiWorkspaceState } from '../ai-workspace-types';

export interface RequestsSlice {
  currentRequest: AiRequest | null;
  requestHistory: AiRequest[];
  requestError: string | null;
}

export interface RequestsActions {
  setCurrentRequest: (request: AiRequest | null) => void;
  addRequestToHistory: (request: AiRequest) => void;
  clearRequestHistory: () => void;
  setRequestError: (error: string | null) => void;
}

export interface AiRequest {
  id: string;
  timestamp: number;
  payload: unknown;
}

export function createRequestsSlice(
  set: Parameters<StateCreator<AiWorkspaceState, [], [], AiWorkspaceState>>[0],
  get: Parameters<StateCreator<AiWorkspaceState, [], [], AiWorkspaceState>>[1]
): RequestsSlice & RequestsActions {
  return {
    currentRequest: null,
    requestHistory: [],
    requestError: null,
    setCurrentRequest: (request) => set({ currentRequest: request }),
    addRequestToHistory: (request) =>
      set((state) => ({
        requestHistory: [request, ...state.requestHistory].slice(0, 50), // Keep last 50
      })),
    clearRequestHistory: () => set({ requestHistory: [] }),
    setRequestError: (error: string | null) => set({ requestError: error }),
  };
}
