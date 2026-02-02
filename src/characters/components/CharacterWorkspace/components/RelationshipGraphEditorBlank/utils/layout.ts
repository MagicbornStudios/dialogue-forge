import type { dia } from '@joint/core';

/**
 * Bring all elements to front so they render above links.
 * Call after loading the graph or after adding links.
 */
export function bringElementsToFront(graph: dia.Graph): void {
  graph.getElements().forEach((el) => el.toFront());
}
