import type { dia } from '@joint/core';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 72;
const LAYOUT_RADIUS = 300;

/**
 * Place active character at center; others in a circle around it.
 * Call after load or after adding a new character.
 */
export function runRelationshipGraphLayout(
  graph: dia.Graph,
  paperWidth: number,
  paperHeight: number,
  activeCharacterId: string | null
): void {
  const elements = graph.getElements();
  if (elements.length === 0) return;

  const centerX = paperWidth / 2 - NODE_WIDTH / 2;
  const centerY = paperHeight / 2 - NODE_HEIGHT / 2;
  const activeId = activeCharacterId ? `character-${activeCharacterId}` : null;

  const activeEl = activeId ? (graph.getCell(activeId) as dia.Element | null) : null;
  const others = elements.filter((el) => String(el.id) !== activeId);

  if (activeEl && activeEl.isElement()) {
    activeEl.position(centerX, centerY);
  }

  if (others.length === 0) return;

  const step = (2 * Math.PI) / others.length;
  others.forEach((el, i) => {
    const angle = i * step;
    const x = centerX + NODE_WIDTH / 2 + LAYOUT_RADIUS * Math.cos(angle) - NODE_WIDTH / 2;
    const y = centerY + NODE_HEIGHT / 2 + LAYOUT_RADIUS * Math.sin(angle) - NODE_HEIGHT / 2;
    el.position(x, y);
  });
}
