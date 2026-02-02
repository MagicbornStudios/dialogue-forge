import type { dia } from '@joint/core';

export type ElementVisualState = {
  hovered: boolean;
  selected: boolean;
};

/**
 * Applies shadcn-ish visual state to our CharacterCard element.
 * Pure: no internal state; caller passes hovered/selected.
 * Expects selectors: plate, plateAccent, selectionStroke, selectionGlowRect, selectionAccent, avatarRing.
 */
export function applyElementVisualState(
  el: dia.Element,
  state: ElementVisualState
): void {
  const { hovered, selected } = state;

  // Priority: selected > hovered > default
  const stroke = selected
    ? 'var(--color-df-border-active)'
    : hovered
      ? 'var(--color-df-border-hover)'
      : 'var(--color-df-control-border)';

  const strokeWidth = selected ? 1.75 : hovered ? 1.5 : 1;

  el.attr('plate/stroke', stroke);
  el.attr('plate/strokeWidth', strokeWidth);

  el.attr(
    'plateAccent/fill',
    selected ? 'var(--color-df-border-active)' : 'var(--color-df-border-selected)'
  );
  el.attr('plateAccent/opacity', selected ? 0.18 : hovered ? 0.75 : 0.6);

  el.attr('selectionStroke/stroke', 'var(--color-df-border-active)');
  el.attr('selectionStroke/opacity', selected ? 1 : 0);
  el.attr('selectionGlowRect/opacity', selected ? 1 : 0);
  el.attr('selectionAccent/fill', 'var(--color-df-border-active)');
  el.attr('selectionAccent/opacity', selected ? 0.9 : 0);

  el.attr('avatarRing/stroke', stroke);
  el.attr('avatarRing/strokeWidth', selected ? 1.5 : hovered ? 1.25 : 1);
}
