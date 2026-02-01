import type { dia } from '@joint/core';

type LinkStyleState = {
  hovered: boolean;
  selected: boolean;
};

const state = new WeakMap<dia.Cell, LinkStyleState>();

function getState(cell: dia.Cell): LinkStyleState {
  const s = state.get(cell) ?? { hovered: false, selected: false };
  state.set(cell, s);
  return s;
}

/**
 * Applies shadcn-ish visual state to RelationshipLink.
 * Expects selectors:
 * - line.stroke + strokeWidth
 * - underlay.stroke + strokeWidth
 * - markerTarget.fill
 * - labelBody.stroke (optional)
 */
export function applyLinkVisualState(link: dia.Link) {
  const { hovered, selected } = getState(link);

  // Priority: selected > hovered > default
  const stroke = selected
    ? 'var(--color-df-border-active)'
    : hovered
      ? 'var(--color-df-edge-default-hover)'
      : 'var(--color-df-edge-default)';

  const width = selected ? 3 : hovered ? 2.75 : 2.25;

  // Main stroke + marker
  link.attr('line/stroke', stroke);
  link.attr('line/strokeWidth', width);
  link.attr('markerTarget/fill', stroke);

  // Underlay depth (keep darker but scale with width)
  link.attr('underlay/stroke', 'rgba(0,0,0,0.35)');
  link.attr('underlay/strokeWidth', width + 2.5);

  // If label pill exists, let its border react slightly
  link.attr('labelBody/stroke', hovered || selected ? stroke : 'var(--color-df-control-border)');
}

export function setLinkHovered(link: dia.Link, hovered: boolean) {
  const s = getState(link);
  s.hovered = hovered;
  applyLinkVisualState(link);
}

export function setLinkSelected(link: dia.Link, selected: boolean) {
  const s = getState(link);
  s.selected = selected;
  applyLinkVisualState(link);
}

export function clearLinkSelected(link: dia.Link) {
  setLinkSelected(link, false);
}
