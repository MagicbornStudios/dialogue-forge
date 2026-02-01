'use client';

import React from 'react';
import { CharacterRow } from './CharacterRow';
import type { CharacterDoc } from '@/characters/types';

interface CharacterListProps {
  characters: CharacterDoc[];
  activeCharacter: CharacterDoc | null;
  otherCharacters: CharacterDoc[];
  searchQuery: string;
  onCharacterSelect?: (characterId: string) => void;
  onAddRelationship?: (character: CharacterDoc) => void;
}

export function CharacterList({
  characters,
  activeCharacter,
  otherCharacters,
  searchQuery,
  onCharacterSelect,
  onAddRelationship,
}: CharacterListProps) {
  if (characters.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        {searchQuery ? 'No characters found' : 'No characters'}
      </div>
    );
  }

  return (
    <div className="py-1">
      {activeCharacter && (
        <CharacterRow
          character={activeCharacter}
          isActive
          onSelect={onCharacterSelect}
          onAddRelationship={onAddRelationship}
        />
      )}
      {otherCharacters.length > 0 && (
        <>
          {activeCharacter && <div className="h-px bg-border my-1" />}
          {otherCharacters.map((character) => (
            <CharacterRow
              key={character.id}
              character={character}
              onSelect={onCharacterSelect}
              onAddRelationship={onAddRelationship}
            />
          ))}
        </>
      )}
      {!activeCharacter && otherCharacters.length === 0 && (
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
          {searchQuery ? 'No characters found' : 'No characters'}
        </div>
      )}
    </div>
  );
}
