import { dia, shapes } from '@joint/core';
import type { RefObject } from 'react';
import type { JointGraphJson } from '@/characters/types';
import { RelationshipLink } from './links';

/**
 * Cell namespace for graph/paper (standard shapes + mb.RelationshipLink).
 */
export function getCellNamespace(): Record<string, unknown> {
  return {
    ...shapes,
    mb: {
      RelationshipLink,
    },
  };
}

export interface RelationshipGraphEditorFacade {
  getJointGraphJson(): JointGraphJson | null;
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
