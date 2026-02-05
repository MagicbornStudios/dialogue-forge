'use client';

import { ForgeWorkspace } from '@magicborn/forge';
import { useState } from 'react';
import { ForgeDataProvider } from '../../lib/forge/ForgeDataProvider';
import { Settings, Code } from 'lucide-react';

export const dynamic = 'force-static';

export default function DialogueForgeApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <ForgeDataProvider>
      <ForgeWorkspace
        className="h-screen"
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        headerLinks={[
          { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
          { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> }
        ]}
      />
    </ForgeDataProvider>
  );
}
