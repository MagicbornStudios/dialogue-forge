'use client';

import { ForgeWorkspace } from '@/src/forge/components/ForgeWorkspace/ForgeWorkspace';
import { useState } from 'react';
import { makePayloadForgeAdapter } from '../../lib/forge/data-adapter/payload-forge-adapter';
import { Settings, Code } from 'lucide-react';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function DialogueForgeApp() {
  // State for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  return (
    <ForgeWorkspace
      className="h-screen"
      dataAdapter={makePayloadForgeAdapter()}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
      headerLinks={[
        { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
        { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> }
      ]}
    />
  );
}
