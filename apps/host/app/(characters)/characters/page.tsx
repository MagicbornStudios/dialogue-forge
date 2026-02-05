'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { CharacterWorkspace } from '@magicborn/characters/components/CharacterWorkspace/CharacterWorkspace';
import {
  CharacterWorkspaceStoreProvider,
  createCharacterWorkspaceStore,
} from '@magicborn/characters/components/CharacterWorkspace/store/character-workspace-store';
import { setupCharacterWorkspaceSubscriptions } from '@magicborn/characters/components/CharacterWorkspace/store/slices/subscriptions';
import { useCharacterDataContext } from '@magicborn/characters/components/CharacterWorkspace/CharacterDataContext';
import { CharacterDataProvider } from '../../lib/characters/CharacterDataProvider';

export const dynamic = 'force-static';

function CharactersAppContent() {
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

export default function CharactersApp() {
  return (
    <CharacterDataProvider>
      <CharactersAppContent />
    </CharacterDataProvider>
  );
}