'use client';

import { ForgeWorkspace } from '@/src/components/ForgeWorkspace/ForgeWorkspace';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useState, useEffect } from 'react';
import type { ForgeGraphDoc } from '@/src/types/forge/forge-graph';
import { makePayloadForgeAdapter } from '../lib/forge/data-adapter/payload-forge-adapter';
import { useForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

function ProjectSync({ selectedProjectId }: { selectedProjectId: number | null }) {
  const setSelectedProjectId = useForgeWorkspaceStore((s) => s.actions.setSelectedProjectId);
  
  useEffect(() => {
    setSelectedProjectId(selectedProjectId);
  }, [selectedProjectId, setSelectedProjectId]);
  
  return null;
}

export default function DialogueForgeApp() {
  // State for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Project Switcher Header */}
      <ProjectSwitcher
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="flex-1 w-full min-h-0">
        <ForgeWorkspace
          className="h-full"
          toolbarActions={<ThemeSwitcher />}
          dataAdapter={makePayloadForgeAdapter()}
        />
        <ProjectSync selectedProjectId={selectedProjectId} />
      </div>
    </div>
  );
}
