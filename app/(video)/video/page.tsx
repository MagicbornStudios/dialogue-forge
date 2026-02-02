'use client';

import { Settings, Code } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { VideoWorkspace } from '@/video/workspace/VideoWorkspace';
import { makePayloadVideoTemplateAdapter } from '@/app/lib/video/payload-video-template-adapter';
import { makePayloadProjectAdapter } from '@/app/lib/video/payload-project-adapter';

export const dynamic = 'force-static';

export default function VideoStudioPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  const videoTemplateAdapter = useMemo(
    () =>
      makePayloadVideoTemplateAdapter({
        projectId: selectedProjectId ?? undefined,
      }),
    [selectedProjectId]
  );

  const projectAdapter = useMemo(
    () => makePayloadProjectAdapter(),
    []
  );

  return (
    <VideoWorkspace
      className="h-screen"
      adapter={videoTemplateAdapter}
      projectAdapter={projectAdapter}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
      headerLinks={[
        { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
        { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> },
      ]}
    />
  );
}
