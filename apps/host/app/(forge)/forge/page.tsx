'use client';

import { ForgeWorkspace, ForgeDataContext } from '@magicborn/forge';
import { useState } from 'react';
import { useForgeData } from '../../lib/forge/use-forge-data';
import { Settings, Code } from 'lucide-react';

export const dynamic = 'force-static';

export default function DialogueForgeApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const forgeData = useForgeData();

  return (
    <ForgeDataContext.Provider value={forgeData}>
      <ForgeWorkspace
        className="h-screen"
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        headerLinks={[
          { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
          { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> }
        ]}
      />
    </ForgeDataContext.Provider>
  );
}
