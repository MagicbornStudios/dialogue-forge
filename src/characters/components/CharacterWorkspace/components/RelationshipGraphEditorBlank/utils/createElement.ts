import { CharacterDoc } from '@/characters/types';
import { createCharacterCardElement } from '../elements';

export function createBlankPlaceholderElement() {
  console.log('createBlankPlaceholderElement');
  return createCharacterCardElement('blank-circle', { x: 0, y: 0 }, { name: 'New Character' });
}

export function createCharacterElement(
  character: CharacterDoc,
  position?: { x: number; y: number }
) {
  const pos = position ?? { x: 0, y: 0 };
  return createCharacterCardElement(`character-${character.id}`, pos, {
    name: character.name,
    avatarUrl: character.avatarUrl ?? character.imageUrl ?? undefined,
  });
}
