'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, Settings } from 'lucide-react';
import { ThemeWorkspace } from '@magicborn/theme';
import { ThemeDataProvider } from '@/lib/theme/ThemeDataProvider';

export default function ThemeWorkspacePage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <div className="h-full min-h-0 flex flex-col bg-df-bg">
      <header className="flex items-center gap-3 border-b border-df-control-border bg-df-surface px-4 py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-df-text-secondary hover:bg-df-control-bg"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <h1 className="text-sm font-semibold text-df-text-primary">Theme Workspace</h1>
      </header>

      <main className="min-h-0 flex-1">
        <ThemeDataProvider>
          <ThemeWorkspace
            className="h-full"
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
            headerLinks={[
              { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
              { label: 'API', href: '/api/graphql-playground', icon: <Code2 size={14} /> },
            ]}
          />
        </ThemeDataProvider>
      </main>
    </div>
  );
}
