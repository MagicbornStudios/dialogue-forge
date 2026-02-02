import type { CharacterDoc, RelationshipDoc, JointGraphJson } from '@/characters/types';
import type { CharacterWorkspaceAdapter } from '@/characters/types';
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
  /** Relationships for the active project (for list + edit). */
  relationships?: RelationshipDoc[];
  /** Refetch relationships after create/update/delete. */
  onRelationshipsRefresh?: () => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
  activeProjectId?: string | null;
  /** Notify when graph JSON changes (e.g. after removing a link). */
  onGraphChange?: (graph: JointGraphJson) => void;
  className?: string;
}
