'use client';

import React, { createContext, useContext } from 'react';
import type { CharacterWorkspaceAdapter } from '@magicborn/characters/types';

const CharacterDataContext = createContext<CharacterWorkspaceAdapter | null>(null);

export function useCharacterDataFromContext(): CharacterWorkspaceAdapter | null {
  return useContext(CharacterDataContext);
}

export { CharacterDataContext };
