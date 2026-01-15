import type { AiDataAdapter } from '@/ai/adapters/types/ai-data-adapter';

export function makePayloadAiAdapter(): AiDataAdapter {
  return {
    async getApiKey() {
      // Get from environment variable or PayloadCMS config
      // For now, return from env
      if (typeof window !== 'undefined') {
        // Client-side: get from localStorage or prompt
        const stored = localStorage.getItem('openrouter-api-key');
        return stored;
      }
      // Server-side: get from env
      return process.env.OPENROUTER_API_KEY ?? null;
    },
    async setApiKey(key: string) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('openrouter-api-key', key);
      }
      // TODO: Save to PayloadCMS config on server
    },
    async testConnection() {
      try {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return false;
        }
        // Simple test - could be enhanced
        return true;
      } catch {
        return false;
      }
    },
    async saveRequestLog(request, response) {
      // Optional: Save to PayloadCMS or local storage
      if (typeof window !== 'undefined') {
        const logs = JSON.parse(localStorage.getItem('ai-request-logs') || '[]');
        logs.unshift({
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          request,
          response,
        });
        localStorage.setItem('ai-request-logs', JSON.stringify(logs.slice(0, 100)));
      }
    },
    async getRequestLogs() {
      if (typeof window !== 'undefined') {
        const logs = JSON.parse(localStorage.getItem('ai-request-logs') || '[]');
        return logs;
      }
      return [];
    },
  };
}
