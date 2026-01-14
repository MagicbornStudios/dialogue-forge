'use client';

import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { ForgeWorkspace as WriterWorkspace } from '@/src/components/ForgeWorkspace/ForgeWorkspace';
import { useState } from 'react';
import { makePayloadWriterAdapter } from '../lib/writer/data-adapter/payload-writer-adapter';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function WriterApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <div className="w-full h-screen flex flex-col">
      <ProjectSwitcher
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="flex-1 w-full min-h-0">
        <WriterWorkspace
          className="h-full"
          dataAdapter={makePayloadWriterAdapter()}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </div>
  );
}
