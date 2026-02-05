'use client';

import { useState } from 'react';
import { WriterWorkspace } from '@magicborn/writer';
import { WriterProjectSwitcher } from '@magicborn/writer/components/WriterWorkspace/layout/WriterProjectSwitcher';
import { ForgeDataProvider } from '../../lib/forge/ForgeDataProvider';
import { WriterDataProvider } from '../../lib/writer/WriterDataProvider';
import { ProjectSwitcher } from '../../../components/ProjectSwitcher';

export const dynamic = 'force-static';

export default function WriterApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <ForgeDataProvider>
      <WriterDataProvider>
        <div className="w-full h-screen flex flex-col">
          <div className="flex-1 w-full min-h-0 flex flex-col">
            <WriterWorkspace
              className="h-full"
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
      </WriterDataProvider>
    </ForgeDataProvider>
  );
}
