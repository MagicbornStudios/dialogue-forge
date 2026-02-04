'use client';

import { useSearchParams } from 'next/navigation';
import { VideoWorkspaceTwick } from '@magicborn/video/workspace/VideoWorkspaceTwick';

export const dynamic = 'force-static';

export default function VideoStudioPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? 'default';
  const templateId = searchParams.get('templateId') ?? 'default';
  const contextId = `video:${projectId}:${templateId}`;

  return (
    <VideoWorkspaceTwick
      className="h-screen w-screen"
      contextId={contextId}
    />
  );
}
