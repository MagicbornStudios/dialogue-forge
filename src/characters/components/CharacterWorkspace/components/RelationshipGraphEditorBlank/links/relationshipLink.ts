import { dia } from '@joint/core';

/**
 * Relationship link for the graph. Defined once for cellNamespace.
 * See JointJS v4 custom links: https://resources.jointjs.com/tutorial/custom-links
 */
export const RelationshipLink = dia.Link.define('mb.RelationshipLink', {
  attrs: {
    line: {
      stroke: 'var(--color-df-edge-default, #6366f1)',
      strokeWidth: 2,
      targetMarker: {
        type: 'path',
        d: 'M 10 -5 0 0 10 5 z',
        fill: 'var(--color-df-edge-default, #6366f1)',
      },
    },
  },
  labels: [],
  router: { name: 'normal' },
  connector: { name: 'rounded' },
});

export function createRelationshipLink(
  sourceId: string,
  targetId: string,
  options?: { id?: string; label?: string }
): dia.Link {
  const link = new RelationshipLink({
    id: options?.id ?? `${sourceId}->${targetId}`,
    source: { id: sourceId },
    target: { id: targetId },
  });
  if (options?.label) {
    link.labels([
      {
        position: 0.5,
        attrs: {
          text: {
            text: options.label,
            fill: 'var(--color-df-text-primary, #374151)',
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          },
          rect: { fill: 'transparent' },
        },
      },
    ]);
  }
  return link;
}
