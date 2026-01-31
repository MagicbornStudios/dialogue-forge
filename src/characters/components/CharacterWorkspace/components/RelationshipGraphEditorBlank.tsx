'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import type { RelationshipFlow } from '@/characters/types';
import type { CharacterDoc, CharacterWorkspaceAdapter } from '@/characters/types';

type JointModule = typeof import('jointjs');

export interface RelationshipGraphEditorRef {
  getJointGraphJson(): object | null;
  getRelationshipFlow(): RelationshipFlow | null;
}

/** Same props as RelationshipGraphEditor so you can swap. initialGraphJson loads saved JointJS snapshot. */
export interface RelationshipGraphEditorBlankProps {
  graph: RelationshipFlow;
  activeCharacterId: string;
  characters: CharacterDoc[];
  selectedNodeId: string | null;
  /** Saved JointJS graph snapshot (graph.toJSON()). When set, loaded via graph.fromJSON(). */
  initialGraphJson?: object | null;
  onGraphChange: (graph: RelationshipFlow) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
  onCharacterSelect?: (characterId: string) => void;
  onCreateCharacter?: () => void;
  onCharacterUpdate?: (
    characterId: string,
    updates: { name?: string; description?: string; imageUrl?: string; avatarId?: string | null }
  ) => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
}

/**
 * Blank graph: JointJS Paper + one built-in Ellipse in the center. No app data, no interaction.
 */
const RelationshipGraphEditorBlank = forwardRef<
  RelationshipGraphEditorRef,
  RelationshipGraphEditorBlankProps
>(function RelationshipGraphEditorBlank({ initialGraphJson, ..._rest }, ref) {
  const paperElRef = useRef<HTMLDivElement>(null);
  const diaGraphRef = useRef<any | null>(null);
  const paperRef = useRef<any | null>(null);
  const initialJsonRef = useRef(initialGraphJson);
  initialJsonRef.current = initialGraphJson;

  useImperativeHandle(
    ref,
    () => ({
      getJointGraphJson(): object | null {
        const g = diaGraphRef.current;
        return g && typeof g.toJSON === 'function' ? g.toJSON() : null;
      },
      getRelationshipFlow(): RelationshipFlow | null {
        return null;
      },
    }),
    []
  );

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      const joint = (await import('jointjs')) as JointModule;
      if (destroyed) return;

      const Ellipse = joint.dia.Element.define(
        'basic.Ellipse',
        {
          attrs: {
            body: {
              cx: 30,
              cy: 30,
              rx: 30,
              ry: 30,
              fill: '#ddd',
              stroke: '#666',
              strokeWidth: 2,
            },
          },
          size: { width: 60, height: 60 },
        },
        { markup: [{ tagName: 'ellipse', selector: 'body' }] }
      );

      const cellNamespace = { basic: { Ellipse } };
      const graph = new joint.dia.Graph({}, { cellNamespace });
      diaGraphRef.current = graph;

      const el = paperElRef.current;
      if (!el) return;

      const paper = new joint.dia.Paper({
        el,
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 800,
        height: 600,
        background: { color: '#f5f5f5' },
        interactive: false,
      });
      paperRef.current = paper;

      const json = initialJsonRef.current;
      const hasCells = json && typeof json === 'object' && 'cells' in json && Array.isArray((json as any).cells) && (json as any).cells.length > 0;
      if (hasCells && typeof graph.fromJSON === 'function') {
        try {
          graph.fromJSON(json as any);
        } catch (_e) {
          const circle = new Ellipse({ id: 'blank-circle' });
          circle.position(370, 270);
          graph.addCell(circle);
        }
      } else {
        const circle = new Ellipse({ id: 'blank-circle' });
        circle.position(370, 270);
        graph.addCell(circle);
      }
    };

    init();

    return () => {
      destroyed = true;
      try {
        paperRef.current?.remove?.();
      } catch {}
      paperRef.current = null;
      diaGraphRef.current = null;
    };
  }, []);

  return (
    <div className="h-full w-full min-h-[400px] overflow-auto bg-[#f5f5f5] rounded-lg border border-gray-300">
      <div ref={paperElRef} className="min-w-full min-h-full" />
    </div>
  );
});

export { RelationshipGraphEditorBlank };
