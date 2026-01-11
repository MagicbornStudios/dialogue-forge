'use client';

import { ForgeWorkspace as DialogueForge } from '@/src/components/ForgeWorkspace/ForgeWorkspace';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useState } from 'react';
import { ForgeGraph } from '@/src/types';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';


export default function DialogueForgeApp() {
  // State for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Project Switcher Header */}
      <ProjectSwitcher
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="flex-1 w-full min-h-0">
        <DialogueForge
          className="h-full"
          toolbarActions={<ThemeSwitcher />}
        />
      </div>
    </div>
  );
}
