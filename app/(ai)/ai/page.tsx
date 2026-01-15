'use client';

import { AiWorkspace } from '@/ai/components/AiWorkspace/AiWorkspace';
import { makePayloadAiAdapter } from '../../lib/ai/data-adapter/payload-ai-adapter';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function AiWorkspacePage() {
  return (
    <AiWorkspace
      className="h-screen"
      dataAdapter={makePayloadAiAdapter()}
    />
  );
}
