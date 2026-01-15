"use client";

import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AiDataAdapter } from '@/ai/adapters/ai-data-adapter';
import { createConfigSlice } from './slices/config.slice';
import { createRequestsSlice, type AiRequest } from './slices/requests.slice';
import { createResponsesSlice, type AiResponse } from './slices/responses.slice';

export interface AiWorkspaceState {
  // Config slice
  apiKey: ReturnType<typeof createConfigSlice>['apiKey'];
  selectedModel: ReturnType<typeof createConfigSlice>['selectedModel'];
  configError: ReturnType<typeof createConfigSlice>['configError'];

  // Requests slice
  currentRequest: ReturnType<typeof createRequestsSlice>['currentRequest'];
  requestHistory: ReturnType<typeof createRequestsSlice>['requestHistory'];
  requestError: ReturnType<typeof createRequestsSlice>['requestError'];

  // Responses slice
  currentResponse: ReturnType<typeof createResponsesSlice>['currentResponse'];
  isStreaming: ReturnType<typeof createResponsesSlice>['isStreaming'];
  responseHistory: ReturnType<typeof createResponsesSlice>['responseHistory'];
  responseError: ReturnType<typeof createResponsesSlice>['responseError'];

  // Data adapter
  dataAdapter?: AiDataAdapter;

  actions: {
    // Config actions
    setApiKey: ReturnType<typeof createConfigSlice>['setApiKey'];
    setSelectedModel: ReturnType<typeof createConfigSlice>['setSelectedModel'];
    setConfigError: ReturnType<typeof createConfigSlice>['setConfigError'];

    // Request actions
    setCurrentRequest: ReturnType<typeof createRequestsSlice>['setCurrentRequest'];
    addRequestToHistory: ReturnType<typeof createRequestsSlice>['addRequestToHistory'];
    clearRequestHistory: ReturnType<typeof createRequestsSlice>['clearRequestHistory'];
    setRequestError: ReturnType<typeof createRequestsSlice>['setRequestError'];

    // Response actions
    setCurrentResponse: ReturnType<typeof createResponsesSlice>['setCurrentResponse'];
    setIsStreaming: ReturnType<typeof createResponsesSlice>['setIsStreaming'];
    addResponseToHistory: ReturnType<typeof createResponsesSlice>['addResponseToHistory'];
    clearResponseHistory: ReturnType<typeof createResponsesSlice>['clearResponseHistory'];
    setResponseError: ReturnType<typeof createResponsesSlice>['setResponseError'];

    // Combined actions
    sendTestRequest: (payload: unknown) => Promise<void>;
  };
}

export interface CreateAiWorkspaceStoreOptions {
  dataAdapter?: AiDataAdapter;
}

export function createAiWorkspaceStore(options: CreateAiWorkspaceStoreOptions) {
  const { dataAdapter } = options;

  return createStore<AiWorkspaceState>()(
    devtools(
      immer((set, get) => {
        const configSlice = createConfigSlice(set, get, dataAdapter);
        const requestsSlice = createRequestsSlice(set, get);
        const responsesSlice = createResponsesSlice(set, get);

        // Load API key on init
        if (dataAdapter) {
          dataAdapter.getApiKey().then((key) => {
            if (key) {
              set({ apiKey: key });
            }
          });
        }

        const sendTestRequest = async (payload: unknown) => {
          const state = get();
          if (!state.apiKey) {
            set({ requestError: 'API key not set' });
            return;
          }

          const request: AiRequest = {
            id: `req_${Date.now()}`,
            timestamp: Date.now(),
            payload,
          };

          set({ currentRequest: request, requestError: null, responseError: null });
          set({ isStreaming: true });

          try {
            const response = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: Array.isArray(payload) ? payload : [{ role: 'user', content: JSON.stringify(payload) }],
                model: state.selectedModel,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || 'Request failed');
            }

            // Handle SSE stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.content) {
                        fullContent += parsed.content;
                        // Update response as we stream
                        set({
                          currentResponse: {
                            id: `resp_${Date.now()}`,
                            timestamp: Date.now(),
                            content: fullContent,
                            model: state.selectedModel,
                          },
                        });
                      }
                    } catch {
                      // Ignore parse errors for non-JSON chunks
                    }
                  }
                }
              }
            }

            const responseObj: AiResponse = {
              id: `resp_${Date.now()}`,
              timestamp: Date.now(),
              content: fullContent || 'No response content',
              model: state.selectedModel,
            };

            set({
              currentResponse: responseObj,
              isStreaming: false,
              responseError: null,
            });

            get().actions.addRequestToHistory(request);
            get().actions.addResponseToHistory(responseObj);

            // Save to adapter if available
            if (dataAdapter?.saveRequestLog) {
              await dataAdapter.saveRequestLog(request, responseObj);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Request failed';
            set({
              requestError: message,
              isStreaming: false,
              responseError: message,
            });
          }
        };

        return {
          ...configSlice,
          ...requestsSlice,
          ...responsesSlice,
          dataAdapter,
          actions: {
            // Config actions
            setApiKey: configSlice.setApiKey,
            setSelectedModel: configSlice.setSelectedModel,
            setConfigError: configSlice.setConfigError,

            // Request actions
            setCurrentRequest: requestsSlice.setCurrentRequest,
            addRequestToHistory: requestsSlice.addRequestToHistory,
            clearRequestHistory: requestsSlice.clearRequestHistory,
            setRequestError: requestsSlice.setRequestError,

            // Response actions
            setCurrentResponse: responsesSlice.setCurrentResponse,
            setIsStreaming: responsesSlice.setIsStreaming,
            addResponseToHistory: responsesSlice.addResponseToHistory,
            clearResponseHistory: responsesSlice.clearResponseHistory,
            setResponseError: responsesSlice.setResponseError,

            // Combined actions
            sendTestRequest,
          },
        };
      }),
      { name: 'AiWorkspaceStore' }
    )
  );
}

const AiWorkspaceStoreContext = createContext<StoreApi<AiWorkspaceState> | null>(null);

export function AiWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: StoreApi<AiWorkspaceState> }>) {
  return (
    <AiWorkspaceStoreContext.Provider value={store}>
      {children}
    </AiWorkspaceStoreContext.Provider>
  );
}

export function useAiWorkspaceStore<T>(selector: (state: AiWorkspaceState) => T): T {
  const store = useContext(AiWorkspaceStoreContext);

  if (!store) {
    throw new Error('useAiWorkspaceStore must be used within AiWorkspaceStoreProvider');
  }

  return useStore(store, selector);
}
