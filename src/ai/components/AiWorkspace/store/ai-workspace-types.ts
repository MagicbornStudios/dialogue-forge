// Forward declaration for AiWorkspaceState to break circular dependency
export interface AiWorkspaceState {
  apiKey: string | null;
  selectedModel: string;
  configError: string | null;
  currentRequest: unknown | null;
  requestHistory: unknown[];
  requestError: string | null;
  currentResponse: unknown | null;
  isStreaming: boolean;
  responseHistory: unknown[];
  responseError: string | null;
  dataAdapter?: unknown;
  actions: Record<string, unknown>;
}
