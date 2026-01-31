import { dia } from '@joint/core';

/**
 * Blank editor placeholder element (rect + label).
 * Uses refWidth/refHeight so it always matches element size.
 */
export const BlankNode = dia.Element.define(
  'mb.BlankNode',
  {
    size: { width: 60, height: 60 },
    attrs: {
      body: {
        refWidth: '100%',
        refHeight: '100%',
        x: 100,
        y: 50,
        strokeWidth: 2,
        stroke: '#666666',
        fill: '#dddddd',
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'new node',
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fontSize: 14,
        fill: '#333333',
        pointerEvents: 'none',
      },
    },
  },
  {
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
  }
);

export function createDefaultPlaceholderElement(
  id: string,
  position: { x: number; y: number }
): dia.Element {
  return new BlankNode({
    id,
    position,
    // size defaults exist, but keeping explicit is fine
    size: { width: 60, height: 60 },
    attrs: {
      label: { text: '' },
    },
  });
}
