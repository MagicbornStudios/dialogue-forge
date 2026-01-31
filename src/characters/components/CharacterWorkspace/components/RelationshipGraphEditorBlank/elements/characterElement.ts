import { dia, shapes } from '@joint/core';

/** Default blank node: built-in Rectangle. No custom element definition. */
export function createDefaultPlaceholderElement(
  id: string,
  position: { x: number; y: number }
): dia.Element {
  return new shapes.standard.Rectangle({
    id,
    position,
    size: { width: 60, height: 60 },
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: '#666666',
        fill: '#dddddd',
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'new node',
        fill: '#333333',
        fontSize: 14,
      },
    },
  });
}
