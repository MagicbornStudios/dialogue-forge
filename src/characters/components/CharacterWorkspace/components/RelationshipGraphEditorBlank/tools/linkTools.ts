import { linkTools } from '@joint/core';

/**
 * Link tools for the relationship graph (e.g. remove, vertices).
 * Extend per JointJS link tools tutorial.
 */
export function getDefaultLinkTools() {
  return [
    new linkTools.Remove({
      distance: '50%',
    }),
  ];
}
