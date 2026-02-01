import { dia } from '@joint/core';
import type { RefObject } from 'react';
import type { JointGraphJson, CharacterDoc } from '@/characters/types';

export { getCellNamespace } from './cellNamespace';

export interface RelationshipGraphEditorFacade {
  getJointGraphJson(): JointGraphJson | null;
  addRelationshipFromActiveToCharacter?(character: CharacterDoc): void;
}

export function createFacadeFromRefs(
  diaGraphRef: RefObject<dia.Graph | null>
): RelationshipGraphEditorFacade {
  return {
    getJointGraphJson(): JointGraphJson | null {
      const g = diaGraphRef.current;
      return g ? (g.toJSON() as Parameters<dia.Graph['fromJSON']>[0]) : null;
    },
  };
}
