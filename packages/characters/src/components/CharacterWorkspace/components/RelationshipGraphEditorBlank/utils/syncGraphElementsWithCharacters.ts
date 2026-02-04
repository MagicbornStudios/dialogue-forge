import type { dia } from '@joint/core';
import type { CharacterDoc } from '@magicborn/characters/types';
import { computeInitials } from '../elements/characterElement';

const CHARACTER_PREFIX = 'character-';

type CharacterCardModel = dia.Element & {
  setName: (name: string) => void;
  setInitials: (initials: string) => void;
  setAvatarUrl: (url?: string | null) => void;
};

/**
 * After loading graph from JSON, sync each character node with current CharacterDoc
 * so name and avatar (and initials) are up to date.
 */
export function syncGraphElementsWithCharacters(
  graph: dia.Graph,
  characters: CharacterDoc[]
): void {
  const elements = graph.getElements();
  for (const el of elements) {
    const type = el.get('type');
    const id = String(el.id);
    if (type !== 'mb.CharacterCard' || !id.startsWith(CHARACTER_PREFIX)) continue;

    const characterId = id.slice(CHARACTER_PREFIX.length);
    const character = characters.find((c) => c.id === characterId);
    if (!character) continue;

    const card = el as CharacterCardModel;
    if (typeof card.setName === 'function') card.setName(character.name);
    if (typeof card.setInitials === 'function') {
      card.setInitials(computeInitials(character.name));
    }
    if (typeof card.setAvatarUrl === 'function') {
      card.setAvatarUrl(character.avatarUrl ?? character.imageUrl ?? null);
    }
  }
}
