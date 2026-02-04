'use client';

import { makePayloadWriterAdapter } from '../../lib/writer/data-adapter/payload-writer-adapter';
import { makePayloadForgeAdapter } from '../../lib/forge/data-adapter/payload-forge-adapter';
import { ProjectSwitcher } from '../../../components/ProjectSwitcher';
import { WriterWorkspace } from '@magicborn/writer/components/WriterWorkspace/WriterWorkspace';
import { WriterProjectSwitcher } from '@magicborn/writer/components/WriterWorkspace/layout/WriterProjectSwitcher';
import { useState } from 'react';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function WriterApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Omit baseUrl so adapters use window.location.origin (correct when dev runs on 3001, etc.)
  const writerAdapter = makePayloadWriterAdapter({});
  const forgeDataAdapter = makePayloadForgeAdapter({});

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex-1 w-full min-h-0 flex flex-col">
        <WriterWorkspace
          className="h-full"
          dataAdapter={writerAdapter}
          forgeDataAdapter={forgeDataAdapter}
          projectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
          topBar={
            <WriterProjectSwitcher
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              renderProjectSwitcher={(props) => <ProjectSwitcher {...props} />}
            />
          }
        />
      </div>
    </div>
  );
}
