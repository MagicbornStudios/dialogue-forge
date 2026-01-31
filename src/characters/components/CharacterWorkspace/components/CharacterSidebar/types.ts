import type { CharacterDoc, RelationshipFlow } from '@/characters/types';

export type SidebarTab = 'characters' | 'relationships';

export interface CharacterSidebarProps {
  characters: CharacterDoc[];
  activeCharacterId: string | null;
  onCharacterSelect?: (characterId: string) => void;
  onCreateCharacter?: () => void;
  graph?: RelationshipFlow | null;
  onGraphChange?: (graph: RelationshipFlow) => void;
  className?: string;
}
