import { getAiAdapter, streamResponse } from '@/app/lib/ai/ai-adapter';

export async function POST(request: Request) {
  const payload = await request.json();
  const adapter = getAiAdapter();
  const response = await adapter.streamChat(payload);
  return streamResponse(response);
}
