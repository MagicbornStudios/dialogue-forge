'use client';

import { CharacterWorkspace } from '@magicborn/characters/components/CharacterWorkspace/CharacterWorkspace';
import { CharacterWorkspaceStoreProvider, createCharacterWorkspaceStore } from '@magicborn/characters/components/CharacterWorkspace/store/character-workspace-store';
import { CharacterDataProvider } from '../../lib/characters/CharacterDataProvider';
import { useCharacterDataFromContext } from '../../lib/characters/CharacterDataContext';
import { useState, useMemo } from 'react';

export const dynamic = 'force-static';

function CharactersAppContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const adapter = useCharacterDataFromContext();
  const store = useMemo(
    () => (adapter ? createCharacterWorkspaceStore({ dataAdapter: adapter }) : null),
    [adapter]
  );

  if (!store || !adapter) return null;

  return (
    <CharacterWorkspaceStoreProvider store={store}>
      <CharacterWorkspace
        dataAdapter={adapter}
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