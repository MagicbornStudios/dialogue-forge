import type { JointGraphJson } from '@/characters/types';
import type { CharacterDoc, CharacterWorkspaceAdapter } from '@/characters/types';
import type { dia } from '@joint/core';
import type { Selection } from './tools/graphInteractions';

export interface RelationshipGraphEditorBlankRef {
  /** Live graph for JointJS API (getLinks, getElements, addCell, etc.). */
  getGraph(): dia.Graph | null;
  /** JSON only for save/load (graph.toJSON() / graph.fromJSON()). */
  getJointGraphJson(): JointGraphJson | null;
  /** Add target character element if missing, then add link from active character element to it. */
  addRelationshipFromActiveToCharacter(character: CharacterDoc): void;
  /** Current selection (element or link id, or null). */
  getSelection(): Selection;
  /** Clear current selection. */
  clearSelection(): void;
  /** Update a link's label and notify via onGraphChange. */
  updateLinkLabel?(linkId: string, label: string): void;
}

/** Same props as RelationshipGraphEditor so you can swap. initialGraphJson loads saved JointJS snapshot. */
export interface RelationshipGraphEditorBlankProps {
  activeCharacterId: string;
  characters: CharacterDoc[];
  selectedNodeId: string | null;
  /** Saved JointJS graph snapshot (graph.toJSON()). When set, loaded via graph.fromJSON(). */
  initialGraphJson?: JointGraphJson | null;
  onGraphChange: (graph: JointGraphJson) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
  onCharacterSelect?: (characterId: string) => void;
  onCreateCharacter?: () => void;
  onCharacterUpdate?: (
    characterId: string,
    updates: { name?: string; description?: string; imageUrl?: string; avatarId?: string | null }
  ) => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
}
