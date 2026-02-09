'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ForgePayloadProvider, ForgeWorkspace } from '@magicborn/forge';
import type {
  CompositionDiagnostic,
  ForgeCompositionV1,
} from '@magicborn/shared/types/composition';
import { WriterWorkspace } from '@magicborn/writer';
import { WriterProjectSwitcher } from '@magicborn/writer/components/WriterWorkspace/layout/WriterProjectSwitcher';
import { CharacterWorkspace } from '@magicborn/characters/components/CharacterWorkspace/CharacterWorkspace';
import {
  CharacterWorkspaceStoreProvider,
  createCharacterWorkspaceStore,
} from '@magicborn/characters/components/CharacterWorkspace/store/character-workspace-store';
import { setupCharacterWorkspaceSubscriptions } from '@magicborn/characters/components/CharacterWorkspace/store/slices/subscriptions';
import { useCharacterDataContext } from '@magicborn/characters/components/CharacterWorkspace/CharacterDataContext';
import { ThemeWorkspace } from '@magicborn/theme';
import { CharacterDataProvider } from '@/lib/characters/CharacterDataProvider';
import { ThemeDataProvider } from '@/lib/theme/ThemeDataProvider';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { Code2, BookOpen, Users, Settings, Palette } from 'lucide-react';
import Link from 'next/link';
import { payload } from '@/lib/forge/payload';

type Workspace = 'forge' | 'writer' | 'theme' | 'characters';

const TABS: { id: Workspace; label: string; icon: React.ReactNode }[] = [
  { id: 'forge', label: 'Forge', icon: <Code2 size={16} /> },
  { id: 'writer', label: 'Writer', icon: <BookOpen size={16} /> },
  { id: 'theme', label: 'Theme', icon: <Palette size={16} /> },
  { id: 'characters', label: 'Characters', icon: <Users size={16} /> },
];

type PlayerCompositionResponse = {
  composition: ForgeCompositionV1;
  resolvedGraphIds: number[];
  diagnostics?: CompositionDiagnostic[];
};

function CharactersWorkspaceContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const adapter = useCharacterDataContext();
  const loadCharacters = useCallback(
    (projectId: string) => (adapter ? adapter.listCharacters(projectId) : Promise.resolve([])),
    [adapter]
  );
  const store = useMemo(() => createCharacterWorkspaceStore({ loadCharacters }), [loadCharacters]);

  useEffect(() => {
    if (store && loadCharacters) {
      setupCharacterWorkspaceSubscriptions(store, loadCharacters);
    }
  }, [store, loadCharacters]);

  if (!store || !adapter) {
    return null;
  }

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
  const requestPlayerComposition = useCallback(
    async (
      rootGraphId: number,
      payload?: { gameState?: unknown; options?: { resolveStorylets?: boolean } }
    ): Promise<PlayerCompositionResponse> => {
      const response = await fetch('/api/forge/player/composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootGraphId,
          gameState: payload?.gameState,
          options: payload?.options,
        }),
      });
      const json = (await response.json()) as
        | ({ ok: true } & PlayerCompositionResponse)
        | { ok: false; message?: string; code?: string };

      if (!response.ok || !json.ok) {
        const message = !json.ok ? json.message : undefined;
        throw new Error(message ?? 'Failed to fetch player composition');
      }

      return {
        composition: json.composition,
        resolvedGraphIds: json.resolvedGraphIds,
        diagnostics: json.diagnostics,
      };
    },
    []
  );

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
            href="/theme"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-df-text-secondary hover:bg-df-control-bg"
            title="Open theme workspace route"
          >
            <Palette size={14} />
            Theme Route
          </Link>
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
        <ForgePayloadProvider client={payload}>
          {workspace === 'forge' && (
            <ForgeWorkspace
              className="h-full"
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              requestPlayerComposition={requestPlayerComposition}
              headerLinks={[
                { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
                { label: 'API', href: '/api/graphql-playground', icon: <Code2 size={14} /> },
              ]}
            />
          )}

          {workspace === 'writer' && (
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
          )}
        </ForgePayloadProvider>

        {workspace === 'theme' && (
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
