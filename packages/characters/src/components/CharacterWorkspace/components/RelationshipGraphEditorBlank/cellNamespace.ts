import { shapes } from '@joint/core';
import { RelationshipLink } from './links';
import {
  ensureCharacterCardNodeDefined,
  getCharacterCardConstructor,
} from './elements/characterElement';

/**
 * Cell namespace for Graph/Paper (standard shapes + mb.RelationshipLink, mb.CharacterCard).
 * Single source for "our shapes" per JointJS cell namespace pattern.
 */
export function getCellNamespace(): Record<string, unknown> {
  ensureCharacterCardNodeDefined();
  const CharacterCard = getCharacterCardConstructor();
  return {
    ...shapes,
    mb: {
      RelationshipLink,
      CharacterCard,
    },
  };
}
