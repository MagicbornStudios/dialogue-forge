'use client';

import { useState } from 'react';
// Dev-kit from Verdaccio: verify install; future Dialogue editor will use EditorShell/DockLayout
import { EditorShell } from '@/lib/forge/dev-kit-bridge';
import { ForgeWorkspace } from '@magicborn/forge';
import { WriterWorkspace } from '@magicborn/writer';
import { WriterProjectSwitcher } from '@magicborn/writer/components/WriterWorkspace/layout/WriterProjectSwitcher';
import { CharacterWorkspace } from '@magicborn/characters/components/CharacterWorkspace/CharacterWorkspace';
import {
  CharacterWorkspaceStoreProvider,
  createCharacterWorkspaceStore,
} from '@magicborn/characters/components/CharacterWorkspace/store/character-workspace-store';
import { setupCharacterWorkspaceSubscriptions } from '@magicborn/characters/components/CharacterWorkspace/store/slices/subscriptions';
import { useCharacterDataContext } from '@magicborn/characters/components/CharacterWorkspace/CharacterDataContext';
import { ForgeDataProvider } from '@/lib/forge/ForgeDataProvider';
import { WriterDataProvider } from '@/lib/writer/WriterDataProvider';
import { CharacterDataProvider } from '@/lib/characters/CharacterDataProvider';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { Code2, BookOpen, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useEffect, useCallback } from 'react';

type Workspace = 'forge' | 'writer' | 'characters';

const TABS: { id: Workspace; label: string; icon: React.ReactNode }[] = [
  { id: 'forge', label: 'Forge', icon: <Code2 size={16} /> },
  { id: 'writer', label: 'Writer', icon: <BookOpen size={16} /> },
  { id: 'characters', label: 'Characters', icon: <Users size={16} /> },
];

function CharactersWorkspaceContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const adapter = useCharacterDataContext();
  const loadCharacters = useCallback(
    (projectId: string) => (adapter ? adapter.listCharacters(projectId) : Promise.resolve([])),
    [adapter]
  );
  const store = useMemo(
    () => createCharacterWorkspaceStore({ loadCharacters }),
    [loadCharacters]
  );

  useEffect(() => {
    if (store && loadCharacters) setupCharacterWorkspaceSubscriptions(store, loadCharacters);
  }, [store, loadCharacters]);

  if (!store || !adapter) return null;

  return (
    <CharacterWorkspaceStoreProvider store={store}>
      <CharacterWorkspace
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />
    </CharacterWorkspaceStoreProvider>
  );
}

export default function StudioPage() {
  const [workspace, setWorkspace] = useState<Workspace>('forge');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <div className="h-full min-h-0 flex flex-col bg-df-bg">
      <header className="flex items-center gap-4 px-4 py-2 border-b border-df-control-border bg-df-surface shrink-0">
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWorkspace(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                workspace === tab.id
                  ? 'bg-df-control-bg text-df-text-primary'
                  : 'text-df-text-secondary hover:bg-df-control-bg/70'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/tweakcn-ai"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-df-text-secondary hover:bg-df-control-bg"
            title="Tweakcn AI helper"
          >
            <Code2 size={14} />
            Tweakcn AI
          </Link>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-df-text-secondary hover:bg-df-control-bg"
            title="Open tweakcn dev app"
          >
            <Code2 size={14} />
            Tweakcn
          </a>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-df-text-secondary hover:bg-df-control-bg"
            title="Payload Admin"
          >
            <Settings size={14} />
            Admin
          </Link>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        {workspace === 'forge' && (
          <ForgeDataProvider>
            <ForgeWorkspace
              className="h-full"
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              headerLinks={[
                { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
                { label: 'API', href: '/api/graphql-playground', icon: <Code2 size={14} /> },
              ]}
            />
          </ForgeDataProvider>
        )}

        {workspace === 'writer' && (
          <ForgeDataProvider>
            <WriterDataProvider>
              <div className="w-full h-full flex flex-col">
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
            </WriterDataProvider>
          </ForgeDataProvider>
        )}

        {workspace === 'characters' && (
          <CharacterDataProvider>
            <CharactersWorkspaceContent />
          </CharacterDataProvider>
        )}
      </main>
    </div>
  );
}
