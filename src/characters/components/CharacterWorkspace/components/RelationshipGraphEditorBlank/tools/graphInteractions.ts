import type { dia } from '@joint/core';
import { applyElementVisualState } from './elementTools';
import { applyLinkVisualState } from './linkTools';

export type Selection = {
  type: 'element' | 'link' | null;
  id: string | null;
};

export interface GraphInteractionFacade {
  destroy(): void;
  getSelection(): Selection;
  clearSelection(): void;
}

export function installGraphInteractions(opts: {
  paper: dia.Paper;
  graph: dia.Graph;
  onSelectionChange?: (sel: Selection) => void;
}): GraphInteractionFacade {
  const { paper, graph, onSelectionChange } = opts;

  let selectedCellId: string | null = null;
  let hoveredCellId: string | null = null;

  const visualState = (cellId: string | null) => ({
    hovered: cellId === hoveredCellId,
    selected: cellId === selectedCellId,
  });

  function applyToCell(cell: dia.Cell): void {
    const id = String(cell.id);
    const state = visualState(id);
    if (cell.isElement()) {
      applyElementVisualState(cell as dia.Element, state);
    } else if (cell.isLink()) {
      applyLinkVisualState(cell as dia.Link, state);
    }
  }

  function clearVisualSelection(): void {
    if (!selectedCellId) return;
    const cell = graph.getCell(selectedCellId);
    if (cell) {
      const state = {
        hovered: selectedCellId === hoveredCellId,
        selected: false,
      };
      if (cell.isElement()) {
        applyElementVisualState(cell as dia.Element, state);
      } else if (cell.isLink()) {
        applyLinkVisualState(cell as dia.Link, state);
      }
    }
    selectedCellId = null;
    onSelectionChange?.({ type: null, id: null });
  }

  function setVisualSelection(cell: dia.Cell): void {
    const id = String(cell.id);
    if (selectedCellId === id) return;

    // Clear previous selection (apply with selected: false)
    if (selectedCellId) {
      const prev = graph.getCell(selectedCellId);
      if (prev) {
        const state = {
          hovered: selectedCellId === hoveredCellId,
          selected: false,
        };
        if (prev.isElement()) {
          applyElementVisualState(prev as dia.Element, state);
        } else if (prev.isLink()) {
          applyLinkVisualState(prev as dia.Link, state);
        }
      }
    }

    selectedCellId = id;
    applyToCell(cell);

    const selection: Selection = cell.isElement()
      ? { type: 'element', id }
      : cell.isLink()
        ? { type: 'link', id }
        : { type: null, id: null };
    onSelectionChange?.(selection);
  }

  function clearHover(): void {
    if (!hoveredCellId) return;
    const cell = graph.getCell(hoveredCellId);
    if (cell) {
      const state = {
        hovered: false,
        selected: hoveredCellId === selectedCellId,
      };
      if (cell.isElement()) {
        applyElementVisualState(cell as dia.Element, state);
      } else if (cell.isLink()) {
        applyLinkVisualState(cell as dia.Link, state);
      }
    }
    hoveredCellId = null;
  }

  function getSelection(): Selection {
    if (!selectedCellId) return { type: null, id: null };
    const cell = graph.getCell(selectedCellId);
    if (!cell) return { type: null, id: null };
    return cell.isElement()
      ? { type: 'element', id: selectedCellId }
      : cell.isLink()
        ? { type: 'link', id: selectedCellId }
        : { type: null, id: null };
  }

  const onCellMouseEnter = (cellView: dia.CellView) => {
    const cell = cellView.model;
    const id = String(cell.id);
    if (hoveredCellId === id) return;
    if (hoveredCellId) {
      const prev = graph.getCell(hoveredCellId);
      if (prev) applyToCell(prev);
    }
    hoveredCellId = id;
    applyToCell(cell);
  };

  const onCellMouseLeave = () => {
    clearHover();
  };

  const onCellPointerClick = (cellView: dia.CellView) => {
    setVisualSelection(cellView.model);
  };

  const onBlankPointerDown = () => {
    clearVisualSelection();
  };

  const onGraphRemove = (cell: dia.Cell) => {
    const id = String(cell.id);
    if (selectedCellId === id) {
      selectedCellId = null;
      onSelectionChange?.({ type: null, id: null });
    }
    if (hoveredCellId === id) hoveredCellId = null;
  };

  paper.on('cell:mouseenter', onCellMouseEnter);
  paper.on('cell:mouseleave', onCellMouseLeave);
  paper.on('cell:pointerclick', onCellPointerClick);
  paper.on('blank:pointerdown', onBlankPointerDown);
  graph.on('remove', onGraphRemove);

  return {
    destroy() {
      paper.off('cell:mouseenter', onCellMouseEnter);
      paper.off('cell:mouseleave', onCellMouseLeave);
      paper.off('cell:pointerclick', onCellPointerClick);
      paper.off('blank:pointerdown', onBlankPointerDown);
      graph.off('remove', onGraphRemove);
    },
    getSelection,
    clearSelection: clearVisualSelection,
  };
}
