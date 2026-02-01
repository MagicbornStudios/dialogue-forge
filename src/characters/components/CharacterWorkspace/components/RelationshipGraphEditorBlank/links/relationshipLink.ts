import { dia } from '@joint/core';

/**
 * Elegant shadcn-ish link:
 * - Underlay stroke (depth, separation from canvas)
 * - Main stroke (muted by default)
 * - Soft arrow marker
 * - Label pill (optional)
 *
 * You can toggle emphasis by calling:
 *   link.attr('line/stroke', 'var(--color-df-edge-default-hover)')
 *   link.attr('markerTarget/fill', 'var(--color-df-edge-default-hover)')
 */
export const RelationshipLink = dia.Link.define(
  'mb.RelationshipLink',
  {
    attrs: {
      // Big invisible hit area
      wrapper: {
        connection: true,
        stroke: 'transparent',
        strokeWidth: 14,
        strokeLinecap: 'round',
        cursor: 'pointer',
      },

      // Underlay for depth
      underlay: {
        connection: true,
        stroke: 'rgba(0,0,0,0.35)',
        strokeWidth: 5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        pointerEvents: 'none',
      },

      // Main line
      line: {
        connection: true,
        stroke: 'var(--color-df-edge-default)',
        strokeWidth: 2.25,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        pointerEvents: 'none',
      },

      // Separate marker selector (cleaner than embedding in line/targetMarker)
      markerTarget: {
        d: 'M 0 0 L 10 5 L 0 10 Q 2 5 0 0 Z',
        fill: 'var(--color-df-edge-default)',
        stroke: 'none',
        pointerEvents: 'none',
      },

      // Label pill (optional; default hidden)
      labelBody: {
        ref: 'labelText',
        refX: -8,
        refY: -6,
        refWidth: '100%',
        refHeight: '100%',
        rx: 999,
        ry: 999,
        fill: 'var(--color-df-control-bg)',
        stroke: 'var(--color-df-control-border)',
        strokeWidth: 1,
        opacity: 0,
        pointerEvents: 'none',
      },
      labelText: {
        text: '',
        fill: 'var(--color-df-text-secondary)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        opacity: 0,
        pointerEvents: 'none',
      },
    },

    router: { name: 'normal' },
    connector: { name: 'rounded', args: { radius: 10 } },
    labels: [],
  },
  {
    markup: [
      { tagName: 'path', selector: 'wrapper' },
      { tagName: 'path', selector: 'underlay', attributes: { fill: 'none' } },
      { tagName: 'path', selector: 'line', attributes: { fill: 'none' } },
      { tagName: 'path', selector: 'markerTarget' },
    ],

    // Define a nice label markup (pill)
    labelMarkup: [
      { tagName: 'rect', selector: 'labelBody' },
      { tagName: 'text', selector: 'labelText' },
    ],
  }
);

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

  // Put the marker at the end; Joint uses attrs on marker selector for the shape,
  // but we still need to position it via "vertices" / "targetMarker"? easiest is
  // using a custom marker element with markup; Joint places it at end automatically
  // when it's part of link markup and has `atConnectionEnd`. We do it here:
  link.attr('markerTarget/atConnectionEnd', true);
  link.attr('markerTarget/transform', 'translate(-8,-5)'); // nudges arrow slightly back/centered

  if (options?.label && options.label.trim().length) {
    link.labels([
      {
        position: 0.5,
        attrs: {
          labelBody: { opacity: 1 },
          labelText: { text: options.label.trim(), opacity: 1 },
        },
        markup: (RelationshipLink as any).labelMarkup,
      },
    ]);
  }

  return link;
}
