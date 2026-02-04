'use client';

import { ForgeWorkspace } from '@magicborn/forge/components/ForgeWorkspace/ForgeWorkspace';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { makePayloadForgeAdapter } from '../../lib/forge/data-adapter/payload-forge-adapter';
import { makePayloadVideoTemplateAdapter } from '../../lib/video/payload-video-template-adapter';
import { mapVideoTemplateOverrides } from '../../lib/video/map-template-overrides';
import { Settings, Code } from 'lucide-react';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function DialogueForgeApp() {
  // State for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const searchParams = useSearchParams();
  const overrideInputs = useMemo(
    () => ({
      background: searchParams.get('background'),
      dialogue: searchParams.get('dialogue'),
      image: searchParams.get('image'),
      speaker: searchParams.get('speaker'),
    }),
    [searchParams],
  );
  const videoTemplateOverrides = useMemo(() => mapVideoTemplateOverrides(overrideInputs), [overrideInputs]);
  const videoTemplateAdapter = useMemo(
    () => makePayloadVideoTemplateAdapter({ projectId: selectedProjectId ?? undefined }),
    [selectedProjectId],
  );

  return (
    <ForgeWorkspace
      className="h-screen"
      dataAdapter={makePayloadForgeAdapter()}
      videoTemplateAdapter={videoTemplateAdapter}
      videoTemplateOverrides={videoTemplateOverrides}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
      headerLinks={[
        { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
        { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> }
      ]}
    />
  );
}
