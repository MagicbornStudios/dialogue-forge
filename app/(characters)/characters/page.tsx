'use client';

import { CharacterWorkspace } from '@/characters/components/CharacterWorkspace/CharacterWorkspace';
import { CharacterWorkspaceStoreProvider, createCharacterWorkspaceStore } from '@/characters/components/CharacterWorkspace/store/character-workspace-store';
import { makePayloadCharacterAdapter } from '@/app/lib/characters/payload-character-adapter';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function CharactersApp() {
  // State for selected project (convert to string for adapter)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  // Character workspace adapter
  const characterAdapter = useMemo(
    () => makePayloadCharacterAdapter({ 
      baseUrl: 'http://localhost:3000',
    }),
    [],
  );

  // Create store instance
  const store = useMemo(
    () => createCharacterWorkspaceStore({ dataAdapter: characterAdapter }),
    [characterAdapter]
  );

  return (
    <CharacterWorkspaceStoreProvider store={store}>
      <CharacterWorkspace
        dataAdapter={characterAdapter}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />
    </CharacterWorkspaceStoreProvider>
  );
}