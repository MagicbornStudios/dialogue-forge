export interface AiDataAdapter {
  // Configuration
  getApiKey(): Promise<string | null>;
  setApiKey(key: string): Promise<void>;
  
  // Test requests
  testConnection(): Promise<boolean>;
  
  // History/logs (optional)
  saveRequestLog?(request: unknown, response: unknown): Promise<void>;
  getRequestLogs?(): Promise<AiRequestLog[]>;
}

export interface AiRequestLog {
  id: string;
  timestamp: number;
  request: unknown;
  response: unknown;
}
