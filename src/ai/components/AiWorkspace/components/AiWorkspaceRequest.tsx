import React from 'react';
import { Send } from 'lucide-react';
import { useAiWorkspaceStore } from '../store/ai-workspace-store';

export function AiWorkspaceRequest() {
  const [requestText, setRequestText] = React.useState('');
  const isStreaming = useAiWorkspaceStore((state) => state.isStreaming);
  const sendTestRequest = useAiWorkspaceStore((state) => state.actions.sendTestRequest);

  const handleSend = async () => {
    if (!requestText.trim() || isStreaming) return;
    
    const payload = {
      messages: [
        {
          role: 'user' as const,
          content: requestText,
        },
      ],
    };
    
    await sendTestRequest(payload);
    setRequestText('');
  };

  return (
    <div className="rounded-lg border border-df-node-border bg-df-editor-bg p-4">
      <h3 className="text-sm font-semibold text-df-text-primary mb-3">Request</h3>
      
      <div className="space-y-2">
        <textarea
          className="w-full rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-sm text-df-text-primary outline-none min-h-[120px] resize-none"
          placeholder="Enter your request..."
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!requestText.trim() || isStreaming}
          className="flex items-center gap-2 rounded-md border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {isStreaming ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  );
}
