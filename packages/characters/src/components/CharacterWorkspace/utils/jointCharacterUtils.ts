import type { CharacterDoc } from '@magicborn/characters/types';
import { dia } from '@joint/core';

const CHARACTER_ELEMENT_PREFIX = 'character-';

export function getCharacterName(characters: CharacterDoc[], cell: dia.Cell): string {
  const cellId = cell?.id?.toString() ?? '';
  const characterId = cellId.startsWith(CHARACTER_ELEMENT_PREFIX)
    ? cellId.slice(CHARACTER_ELEMENT_PREFIX.length)
    : cellId;
  const character = characters.find((c) => c.id === characterId);
  return character?.name ?? 'Unknown';
}
