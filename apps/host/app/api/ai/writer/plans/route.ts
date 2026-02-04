import { getAiAdapter, jsonResponse } from '../../../../lib/ai/ai-adapter';

export async function POST(request: Request) {
  const payload = await request.json();
  const adapter = getAiAdapter();
  const response = await adapter.createPlan(payload);
  return jsonResponse(response);
}
