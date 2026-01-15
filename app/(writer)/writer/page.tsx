'use client';

import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { WriterWorkspace } from '@/writer/components/WriterWorkspace';
import { useState } from 'react';

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
        />
      </div>
    </div>
  );
}
