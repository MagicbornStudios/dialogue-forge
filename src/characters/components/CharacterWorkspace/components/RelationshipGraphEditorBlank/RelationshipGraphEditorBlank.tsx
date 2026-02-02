'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { dia } from '@joint/core';


import { getCellNamespace } from './facade';
import { createBlankPlaceholderElement, createCharacterElement } from './utils/createElement';
import { createRelationshipLink, RelationshipLink } from './links';
import { bringElementsToFront } from './utils/layout';
import { runRelationshipGraphLayout } from './utils/relationshipGraphLayout';
import { syncGraphElementsWithCharacters } from './utils/syncGraphElementsWithCharacters';
import { installPaperViewport } from './utils/paperViewport';
import { installGraphInteractions } from './tools/graphInteractions';
import type { RelationshipGraphEditorBlankRef, RelationshipGraphEditorBlankProps } from './types';
import type { JointGraphJson, CharacterDoc } from '@/characters/types';

const MIN_PAPER_WIDTH = 800;
const MIN_PAPER_HEIGHT = 600;

function getPaperDimensions(wrapper: HTMLDivElement): { width: number; height: number } {
  const w = wrapper.clientWidth || MIN_PAPER_WIDTH;
  const h = wrapper.clientHeight || MIN_PAPER_HEIGHT;
  return {
    width: Math.max(MIN_PAPER_WIDTH, w),
    height: Math.max(MIN_PAPER_HEIGHT, h),
  };
}

const RelationshipGraphEditorBlank = forwardRef<
  RelationshipGraphEditorBlankRef,
  RelationshipGraphEditorBlankProps
>(function RelationshipGraphEditorBlank({ initialGraphJson, activeCharacterId, characters, onGraphChange, onNodeSelect, onEdgeClick, ..._rest }, ref) {
  const activeCharacter = characters.find(character => character.id === activeCharacterId);
  const paperElRef = useRef<HTMLDivElement>(null);
  const diaGraphRef = useRef<dia.Graph | null>(null);
  const paperRef = useRef<dia.Paper | null>(null);
  const interactionsRef = useRef<ReturnType<typeof installGraphInteractions> | null>(null);
  const viewportRef = useRef<ReturnType<typeof installPaperViewport> | null>(null);
  const paperDimensionsRef = useRef({ width: MIN_PAPER_WIDTH, height: MIN_PAPER_HEIGHT });
  const onGraphChangeRef = useRef(onGraphChange);
  const onNodeSelectRef = useRef(onNodeSelect);
  const onEdgeClickRef = useRef(onEdgeClick);
  onGraphChangeRef.current = onGraphChange;
  onNodeSelectRef.current = onNodeSelect ?? undefined;
  onEdgeClickRef.current = onEdgeClick ?? undefined;

  const initialJsonRef = useRef(initialGraphJson);
  initialJsonRef.current = initialGraphJson;

  useImperativeHandle(
    ref,
    () => ({
      getGraph() {
        return diaGraphRef.current;
      },
      getJointGraphJson() {
        const g = diaGraphRef.current;
        return g ? (g.toJSON() as Parameters<dia.Graph['fromJSON']>[0]) : null;
      },
      addRelationshipFromActiveToCharacter(character: CharacterDoc) {
        const graph = diaGraphRef.current;
        if (!graph || !activeCharacterId) return;
        const sourceId = `character-${activeCharacterId}`;
        const targetId = `character-${character.id}`;
        if (sourceId === targetId) return;

        const existingTarget = graph.getCell(targetId);
        if (!existingTarget) {
          const targetElement = createCharacterElement(character);
          graph.addCell(targetElement);
        }

        const link = createRelationshipLink(sourceId, targetId);
        graph.addCell(link);
        bringElementsToFront(graph);
        const { width, height } = paperDimensionsRef.current;
        runRelationshipGraphLayout(graph, width, height, activeCharacterId);
        const json = graph.toJSON() as JointGraphJson;
        onGraphChangeRef.current?.(json);
      },
      getSelection() {
        return interactionsRef.current?.getSelection() ?? { type: null, id: null };
      },
      clearSelection() {
        interactionsRef.current?.clearSelection();
      },
      updateLinkLabel(linkId: string, label: string) {
        const graph = diaGraphRef.current;
        if (!graph) return;
        const cell = graph.getCell(linkId);
        if (!cell || !cell.isLink?.()) return;
        const link = cell as dia.Link;
        const labelMarkup = (RelationshipLink as { labelMarkup?: dia.MarkupJSON }).labelMarkup;
        if (label?.trim().length) {
          link.labels([
            {
              position: 0.5,
              attrs: {
                labelBody: { opacity: 1 },
                labelText: { text: label.trim(), opacity: 1 },
              },
              markup: labelMarkup,
            },
          ]);
        } else {
          link.labels([]);
        }
        const json = graph.toJSON() as JointGraphJson;
        onGraphChangeRef.current?.(json);
      },
    }),
    [activeCharacterId]
  );

  useEffect(() => {
    const wrapper = paperElRef.current;
    if (!wrapper) return;

    // Create a dedicated container for JointJS so we never pass the React-rendered div to Paper.
    const paperContainer = document.createElement('div');
    paperContainer.style.width = '100%';
    paperContainer.style.height = '100%';
    paperContainer.style.minWidth = `${MIN_PAPER_WIDTH}px`;
    paperContainer.style.minHeight = `${MIN_PAPER_HEIGHT}px`;
    wrapper.appendChild(paperContainer);

    const { width: initialWidth, height: initialHeight } = getPaperDimensions(wrapper);
    paperDimensionsRef.current = { width: initialWidth, height: initialHeight };

    const cellNamespace = getCellNamespace();

    const graph = new dia.Graph({}, {
      cellNamespace,
    } as dia.Graph.Options);
    diaGraphRef.current = graph;

    const paper = new dia.Paper({
      el: paperContainer,
      model: graph,
      width: initialWidth,
      height: initialHeight,
      background: { color: '#f5f5f5' },
      interactive: true,
      cellViewNamespace: cellNamespace,
    } as dia.Paper.Options);
    paperRef.current = paper;

    interactionsRef.current?.destroy();
    interactionsRef.current = installGraphInteractions({
      paper,
      graph,
      onSelectionChange: (sel) => {
        if (sel.type === 'element') onNodeSelectRef.current?.(sel.id);
        else if (sel.type === 'link') onEdgeClickRef.current?.(sel.id ?? '');
        else onNodeSelectRef.current?.(null);
      },
    });

    viewportRef.current?.destroy();
    viewportRef.current = installPaperViewport(paper, { container: paperContainer });

    const json = initialJsonRef.current as JointGraphJson;
    const hasCells = json && 'cells' in json && json.cells && (json.cells as unknown[]).length > 0;
    if (hasCells) {
      graph.fromJSON(json);
      syncGraphElementsWithCharacters(graph, characters);
    } else {
      if (activeCharacter) {
        graph.addCell(createCharacterElement(activeCharacter));
      } else {
        graph.addCell(createBlankPlaceholderElement());
      }
    }

    bringElementsToFront(graph);
    runRelationshipGraphLayout(graph, initialWidth, initialHeight, activeCharacterId);

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = getPaperDimensions(wrapper);
      paperDimensionsRef.current = { width, height };
      paper.setDimensions(width, height);
    });
    resizeObserver.observe(wrapper);

    return () => {
      viewportRef.current?.destroy();
      viewportRef.current = null;
      resizeObserver.disconnect();
      interactionsRef.current?.destroy();
      interactionsRef.current = null;
      try {
        paperRef.current?.remove?.();
      } catch {
        // ignore
      }
      paperRef.current = null;
      diaGraphRef.current = null;
      paperContainer.remove();
    };
  }, [activeCharacterId, characters]);

  return (
    <div className="h-full w-full min-h-[400px] overflow-auto rounded-lg border border-gray-300 bg-[#f5f5f5]">
      <div
        ref={paperElRef}
        className="min-w-[800px] min-h-[600px] w-full h-full"
      />
    </div>
  );
});

export { RelationshipGraphEditorBlank };
