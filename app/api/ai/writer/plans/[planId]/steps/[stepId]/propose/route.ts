import { getAiAdapter, jsonResponse } from '@/app/lib/ai/ai-adapter';

type RouteParams = {
  params: Promise<{
    planId: string;
    stepId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { planId, stepId } = await params;
  const payload = await request.json();
  const adapter = getAiAdapter();
  const response = await adapter.proposePlanStep({
    planId,
    stepId,
    payload,
  });
  return jsonResponse(response);
}
