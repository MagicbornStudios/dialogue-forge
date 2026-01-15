'use client';

import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { makePayloadWriterAdapter } from '@/host/writer/data-adapter/payload-writer-adapter';
import { WriterWorkspace } from '@/writer/components/WriterWorkspace/WriterWorkspace';
import { useState } from 'react';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function WriterApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  makePayloadWriterAdapter
  const writerAdapter = makePayloadWriterAdapter({
    baseUrl: 'http://localhost:3000',
  });


  return (
    <div className="w-full h-screen flex flex-col">
      <ProjectSwitcher
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="flex-1 w-full min-h-0">
        <WriterWorkspace
          className="h-full"
          // dataAdapter={writerAdapter}
          // selectedProjectId={selectedProjectId}
          // onProjectChange={setSelectedProjectId}
        />
      </div>
    </div>
  );
}
