import type { CharacterDoc } from '@/characters/types';
import type { RelationshipGraphEditorBlankRef } from '../RelationshipGraphEditorBlank';

export type SidebarTab = 'characters' | 'relationships';

export interface CharacterSidebarProps {
  characters: CharacterDoc[];
  activeCharacterId: string | null;
  onCharacterSelect?: (characterId: string) => void;
  onCreateCharacter?: () => void;
  /** Add a link from the active character element to the given character on the graph. */
  onAddRelationship?: (character: CharacterDoc) => void;
  /** Ref to the graph editor: getGraph() for JointJS API, getJointGraphJson() for save/load. */
  graphEditorRef?: React.RefObject<RelationshipGraphEditorBlankRef | null>;
  className?: string;
}
