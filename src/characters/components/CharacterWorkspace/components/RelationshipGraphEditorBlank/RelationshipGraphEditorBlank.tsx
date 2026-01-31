'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { dia } from '@joint/core';


import { getCellNamespace } from './facade';
import { createBlankPlaceholderElement } from './utils/createElement';
import type { RelationshipGraphEditorBlankRef, RelationshipGraphEditorBlankProps } from './types';
import { JointGraphJson } from '@/characters/types';

const RelationshipGraphEditorBlank = forwardRef<
  RelationshipGraphEditorBlankRef,
  RelationshipGraphEditorBlankProps
>(function RelationshipGraphEditorBlank({ initialGraphJson, ..._rest }, ref) {
  const paperElRef = useRef<HTMLDivElement>(null);
  const diaGraphRef = useRef<dia.Graph | null>(null);
  const paperRef = useRef<dia.Paper | null>(null);

  const activeCharacterId = _rest.activeCharacterId;

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
    }),
    []
  );

  useEffect(() => {
    const wrapper = paperElRef.current;
    if (!wrapper) return;

    // Create a dedicated container for JointJS so we never pass the React-rendered div to Paper.
    // JointJS appends/manages SVG inside this container; the wrapper stays visible and stable.
    const paperContainer = document.createElement('div');
    paperContainer.style.width = '800px';
    paperContainer.style.height = '600px';
    paperContainer.style.minWidth = '800px';
    paperContainer.style.minHeight = '600px';
    wrapper.appendChild(paperContainer);

    const cellNamespace = getCellNamespace();

    const graph = new dia.Graph({}, {
      cellNamespace,
    } as dia.Graph.Options);
    diaGraphRef.current = graph;

    const paper = new dia.Paper({
      el: paperContainer,
      model: graph,
      width: 800,
      height: 600,
      background: { color: '#f5f5f5' },
      interactive: false,
      cellViewNamespace: cellNamespace,
    } as dia.Paper.Options);
    paperRef.current = paper;

    const json = initialJsonRef.current as JointGraphJson;
    if (json && 'cells' in json && json.cells) {
      graph.fromJSON(json);
    } else {
      graph.addCell(createBlankPlaceholderElement());
    }

    return () => {
      try {
        paperRef.current?.remove?.();
      } catch {
        // ignore
      }
      paperRef.current = null;
      diaGraphRef.current = null;
      paperContainer.remove();
    };
  }, []);

  return (
    <div className="h-full w-full min-h-[400px] overflow-auto rounded-lg border border-gray-300 bg-[#f5f5f5]">
      <div
        ref={paperElRef}
        className="min-w-[800px] min-h-[600px] "
      />
    </div>
  );
});

export { RelationshipGraphEditorBlank };
