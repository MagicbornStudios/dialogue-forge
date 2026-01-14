import { getAiAdapter, jsonResponse } from '@/app/lib/ai/ai-adapter';

type RouteParams = {
  params: {
    planId: string;
    stepId: string;
  };
};

export async function POST(request: Request, { params }: RouteParams) {
  const payload = await request.json();
  const adapter = getAiAdapter();
  const response = await adapter.proposePlanStep({
    planId: params.planId,
    stepId: params.stepId,
    payload,
  });
  return jsonResponse(response);
}
