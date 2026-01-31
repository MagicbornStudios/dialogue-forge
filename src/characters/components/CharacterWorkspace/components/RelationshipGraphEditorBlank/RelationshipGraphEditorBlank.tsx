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
    const el = paperElRef.current;
    if (!el) return;

    const cellNamespace = getCellNamespace() as { [key: string]: unknown };

    const graph = new dia.Graph({}, { cellNamespace });
    diaGraphRef.current = graph;

    const paper = new dia.Paper({
      el,
      model: graph,
      width: 800,
      height: 600,
      background: { color: '#f5f5f5' },
      interactive: false,
      cellViewNamespace: cellNamespace,
    });
    paperRef.current = paper;

    const json = initialJsonRef.current as JointGraphJson;
    console.log('json', json);

    // No typeof checks: json is already the correct structural type (or null/undefined).
    if (json && 'cells' in json && json.cells) {
      graph.fromJSON(json);
    } else {
      graph.addCell(createBlankPlaceholderElement());
    }
    console.log('activeCharacterId', activeCharacterId);
    console.log('graph', graph.toJSON());
    console.log('paper', paper);
    console.log('json', json);
    console.log('cells', json?.cells);

    return () => {
      try {
        paperRef.current?.remove?.();
      } catch {
        // ignore
      }
      paperRef.current = null;
      diaGraphRef.current = null;
    };
  }, [activeCharacterId]);

  return (
    <div className="h-full w-full min-h-[400px] overflow-auto bg-black rounded-lg border border-gray-300">
      <div>yolo</div>
      <div ref={paperElRef} className="min-w-full min-h-full" />
    </div>
  );
});

export { RelationshipGraphEditorBlank };
