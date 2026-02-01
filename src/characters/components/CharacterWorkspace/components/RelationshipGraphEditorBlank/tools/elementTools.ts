import type { dia } from '@joint/core';

type ElementStyleState = {
  hovered: boolean;
  selected: boolean;
};

const state = new WeakMap<dia.Cell, ElementStyleState>();

function getState(cell: dia.Cell): ElementStyleState {
  const s = state.get(cell) ?? { hovered: false, selected: false };
  state.set(cell, s);
  return s;
}

/**
 * Applies shadcn-ish visual state to our CharacterCard element.
 * This expects the element to have selectors:
 * - plate.stroke, plate.strokeWidth
 * - plateAccent.fill + opacity
 * - selectionStroke.opacity
 * - selectionGlowRect.opacity
 * - selectionAccent.opacity
 */
export function applyElementVisualState(el: dia.Element) {
  const { hovered, selected } = getState(el);

  // Priority: selected > hovered > default
  const stroke = selected
    ? 'var(--color-df-border-active)'
    : hovered
      ? 'var(--color-df-border-hover)'
      : 'var(--color-df-control-border)';

  const strokeWidth = selected ? 1.75 : hovered ? 1.5 : 1;

  // Base plate stroke
  el.attr('plate/stroke', stroke);
  el.attr('plate/strokeWidth', strokeWidth);

  // Accent line behavior:
  // - default: subtle
  // - hover: slightly brighter
  // - selected: show a stronger selection accent (handled by selection layers too)
  el.attr('plateAccent/fill', selected ? 'var(--color-df-border-active)' : 'var(--color-df-border-selected)');
  el.attr('plateAccent/opacity', selected ? 0.18 : hovered ? 0.75 : 0.6);

  // Selection layers (if present)
  el.attr('selectionStroke/stroke', 'var(--color-df-border-active)');
  el.attr('selectionStroke/opacity', selected ? 1 : 0);
  el.attr('selectionGlowRect/opacity', selected ? 1 : 0);
  el.attr('selectionAccent/fill', 'var(--color-df-border-active)');
  el.attr('selectionAccent/opacity', selected ? 0.9 : 0);

  // Optional: avatar ring stroke can follow hover/selection
  el.attr('avatarRing/stroke', stroke);
  el.attr('avatarRing/strokeWidth', selected ? 1.5 : hovered ? 1.25 : 1);
}

export function setElementHovered(el: dia.Element, hovered: boolean) {
  const s = getState(el);
  s.hovered = hovered;
  applyElementVisualState(el);
}

export function setElementSelected(el: dia.Element, selected: boolean) {
  const s = getState(el);
  s.selected = selected;
  applyElementVisualState(el);
}

export function clearElementSelected(el: dia.Element) {
  setElementSelected(el, false);
}
