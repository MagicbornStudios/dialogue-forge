'use client';

import { ForgeWorkspace } from '@/src/forge/components/ForgeWorkspace/ForgeWorkspace';
import { useMemo, useState } from 'react';
import { makePayloadForgeAdapter } from '@/host/forge/data-adapter/payload-forge-adapter';
import { makePayloadVideoTemplateAdapter } from '@/app/lib/video/payload-video-template-adapter';
import { Settings, Code } from 'lucide-react';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function DialogueForgeApp() {
  // State for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const videoTemplateAdapter = useMemo(
    () => makePayloadVideoTemplateAdapter({ projectId: selectedProjectId ?? undefined }),
    [selectedProjectId],
  );

  return (
    <ForgeWorkspace
      className="h-screen"
      dataAdapter={makePayloadForgeAdapter()}
      videoTemplateAdapter={videoTemplateAdapter}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
      headerLinks={[
        { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
        { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> }
      ]}
    />
  );
}
