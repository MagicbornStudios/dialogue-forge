'use client';

import { CharacterWorkspace } from '@/characters/components/CharacterWorkspace/CharacterWorkspace';
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
    [selectedProjectId],
  );

  return (
    <CharacterWorkspace
      dataAdapter={characterAdapter}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
    />
  );
}