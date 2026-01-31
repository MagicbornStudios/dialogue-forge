import { elementTools } from '@joint/core';

/**
 * Element tools for the relationship graph (e.g. remove, connect).
 * Extend per JointJS element tools tutorial.
 */
export function getDefaultElementTools() {
  return [new elementTools.Remove()];
}
