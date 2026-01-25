'use client';

import { makePayloadWriterAdapter } from '@/host/writer/data-adapter/payload-writer-adapter';
import { makePayloadForgeAdapter } from '@/host/forge/data-adapter/payload-forge-adapter';
import { WriterWorkspace } from '@/writer/components/WriterWorkspace/WriterWorkspace';
import { WriterProjectSwitcher } from '@/writer/components/WriterWorkspace/layout/WriterProjectSwitcher';
import { useState } from 'react';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function WriterApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const writerAdapter = makePayloadWriterAdapter({
    baseUrl: 'http://localhost:3000',
  });

  const forgeDataAdapter = makePayloadForgeAdapter({
    baseUrl: 'http://localhost:3000',
  });

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex-1 w-full min-h-0 flex flex-col">
        <WriterWorkspace
          className="h-full"
          dataAdapter={writerAdapter}
          forgeDataAdapter={forgeDataAdapter}
          projectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
          topBar={<WriterProjectSwitcher selectedProjectId={selectedProjectId} onProjectChange={setSelectedProjectId} />}
        />
      </div>
    </div>
  );
}
