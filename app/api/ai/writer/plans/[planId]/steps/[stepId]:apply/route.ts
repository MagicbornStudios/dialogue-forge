import {
  getAiAdapter,
  isServerSideApplyEnabled,
  jsonResponse,
} from '@/app/lib/ai/ai-adapter';

type RouteParams = {
  params: {
    planId: string;
    stepId: string;
  };
};

const APPLY_DISABLED_MESSAGE = 'Server-side apply is disabled.';

export async function POST(request: Request, { params }: RouteParams) {
  if (!isServerSideApplyEnabled()) {
    return jsonResponse({
      ok: false,
      error: {
        message: APPLY_DISABLED_MESSAGE,
        status: 404,
      },
    });
  }

  const payload = await request.json();
  const adapter = getAiAdapter();
  const response = await adapter.applyPlanStep?.({
    planId: params.planId,
    stepId: params.stepId,
    payload,
  });

  if (!response) {
    return jsonResponse({
      ok: false,
      error: {
        message: APPLY_DISABLED_MESSAGE,
        status: 404,
      },
    });
  }

  return jsonResponse(response);
}
