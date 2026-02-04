import type { dia } from '@joint/core';

export type LinkVisualState = {
  hovered: boolean;
  selected: boolean;
};

/**
 * Applies shadcn-ish visual state to RelationshipLink.
 * Pure: no internal state; caller passes hovered/selected.
 * Expects selectors: line, underlay, markerTarget, labelBody.
 */
export function applyLinkVisualState(
  link: dia.Link,
  state: LinkVisualState
): void {
  const { hovered, selected } = state;

  // Priority: selected > hovered > default
  const stroke = selected
    ? 'var(--color-df-border-active)'
    : hovered
      ? 'var(--color-df-edge-default-hover)'
      : 'var(--color-df-edge-default)';

  const width = selected ? 3 : hovered ? 2.75 : 2.25;

  link.attr('line/stroke', stroke);
  link.attr('line/strokeWidth', width);
  link.attr('markerTarget/fill', stroke);

  link.attr('underlay/stroke', 'rgba(0,0,0,0.35)');
  link.attr('underlay/strokeWidth', width + 2.5);

  link.attr(
    'labelBody/stroke',
    hovered || selected ? stroke : 'var(--color-df-control-border)'
  );
}
