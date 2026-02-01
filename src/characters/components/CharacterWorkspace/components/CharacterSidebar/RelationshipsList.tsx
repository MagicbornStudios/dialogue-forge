'use client';

import React from 'react';
import { dia } from '@joint/core';
import { EdgeRow } from './EdgeRow';
import type { CharacterDoc } from '@/characters/types';
import type { RelationshipGraphEditorBlankRef } from '../RelationshipGraphEditorBlank';
import { getCharacterName } from '@/characters/components/CharacterWorkspace/utils/jointCharacterUtils';

interface RelationshipsListProps {
  activeCharacterId: string | null;
  graphEditorRef?: React.RefObject<RelationshipGraphEditorBlankRef | null>;
  characters: CharacterDoc[];
}

/** Shape for EdgeRow: id, source, target, data from link (mbData). */
interface EdgeLike {
  id: string;
  source: string;
  target: string;
  data?: { label?: string; why?: string };
}

function linkToEdge(link: dia.Link): EdgeLike {
  const src = link.getSourceCell();
  const tgt = link.getTargetCell();
  const sourceId = src?.id?.toString() ?? '';
  const targetId = tgt?.id?.toString() ?? '';
  const mbData = (link.get('mbData') as { label?: string; why?: string } | undefined) ?? {};
  return {
    id: link.id?.toString() ?? '',
    source: sourceId,
    target: targetId,
    data: mbData,
  };
}

export function RelationshipsList({
  activeCharacterId,
  graphEditorRef,
  characters,
}: RelationshipsListProps) {
  const graph = graphEditorRef?.current?.getGraph() ?? null;
  const links = graph?.getLinks() ?? [];
  const activeElementId = activeCharacterId ? `character-${activeCharacterId}` : '';
  const linksForActive = React.useMemo(() => {
    if (!activeElementId) return [];
    return links.filter((link: dia.Link) => {
      const src = link.getSourceCell();
      const tgt = link.getTargetCell();
      const sid = src?.id?.toString();
      const tid = tgt?.id?.toString();
      return sid === activeElementId || tid === activeElementId;
    });
  }, [links, activeElementId]);

  if (!activeCharacterId) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        Select a character to view relationships
      </div>
    );
  }
  if (linksForActive.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        No relationships yet
      </div>
    );
  }

  return (
    <div className="py-1">
      {linksForActive.map((link: dia.Link) => {
        const sourceEl = link.getSourceElement();
        const targetEl = link.getTargetElement();
        const edge = linkToEdge(link);
        return (
          <EdgeRow
            key={edge.id}
            edge={edge as any}
            sourceName={getCharacterName(characters, sourceEl as dia.Cell)}
            targetName={getCharacterName(characters, targetEl as dia.Cell)}
            isEditing={false}
            editLabel={''}
            editWhy={''}
            onEditLabel={() => {}}
            onEditWhy={() => {}}
            onEdit={() => {}}
            onSave={() => {}}
            onCancel={() => {}}
            onDelete={() => {}}
          />
        );
      })}
    </div>
  );
}
