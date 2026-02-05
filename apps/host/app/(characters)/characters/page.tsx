'use client';

import { CharacterWorkspace } from '@magicborn/characters/components/CharacterWorkspace/CharacterWorkspace';
import { CharacterWorkspaceStoreProvider, createCharacterWorkspaceStore } from '@magicborn/characters/components/CharacterWorkspace/store/character-workspace-store';
import { useCharacterData } from '../../lib/characters/use-character-data';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-static';

export default function CharactersApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const characterData = useCharacterData();

  const store = useMemo(
    () => createCharacterWorkspaceStore({ dataAdapter: characterData }),
    [characterData]
  );

  return (
    <CharacterWorkspaceStoreProvider store={store}>
      <CharacterWorkspace
        dataAdapter={characterData}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />
    </CharacterWorkspaceStoreProvider>
  );
}