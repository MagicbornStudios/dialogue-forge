'use client';

import { useState } from 'react';
import { WriterWorkspace, WriterDataContext } from '@magicborn/writer';
import { ForgeDataContext } from '@magicborn/forge';
import { useForgeData } from '../../lib/forge/use-forge-data';
import { useWriterData } from '../../lib/writer/use-writer-data';
import { ProjectSwitcher } from '../../../components/ProjectSwitcher';
import { WriterProjectSwitcher } from '@magicborn/writer/components/WriterWorkspace/layout/WriterProjectSwitcher';

export const dynamic = 'force-static';

export default function WriterApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const writerData = useWriterData();
  const forgeData = useForgeData();

  return (
    <WriterDataContext.Provider value={writerData}>
      <ForgeDataContext.Provider value={forgeData}>
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
      </ForgeDataContext.Provider>
    </WriterDataContext.Provider>
  );
}
