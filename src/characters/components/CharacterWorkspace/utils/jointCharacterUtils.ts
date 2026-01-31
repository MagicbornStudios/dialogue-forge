import type { CharacterDoc } from '@/characters/types';
import { dia } from '@joint/core';

export function getCharacterName(characters: CharacterDoc[], cell: dia.Cell): string {
  const character = characters.find((c) => c.id === cell.id);
  return character?.name ?? 'Unknown';
}
