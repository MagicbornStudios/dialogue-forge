'use client';

import React, { useState, useMemo } from 'react';
import { dia } from '@joint/core';
import { EdgeRow } from './EdgeRow';
import type { CharacterDoc, RelationshipDoc, RelationshipFlowEdge } from '@magicborn/characters/types';
import type { CharacterWorkspaceAdapter } from '@magicborn/characters/types';
import type { RelationshipGraphEditorBlankRef } from '../RelationshipGraphEditorBlank';
import { getCharacterName } from '@magicborn/characters/components/CharacterWorkspace/utils/jointCharacterUtils';

const ELEMENT_PREFIX = 'character-';

function linkIdToCharacterIds(link: dia.Link): { sourceCharacterId: string; targetCharacterId: string } {
  const src = link.getSourceCell();
  const tgt = link.getTargetCell();
  const sourceElId = src?.id?.toString() ?? '';
  const targetElId = tgt?.id?.toString() ?? '';
  const sourceCharacterId = sourceElId.startsWith(ELEMENT_PREFIX) ? sourceElId.slice(ELEMENT_PREFIX.length) : sourceElId;
  const targetCharacterId = targetElId.startsWith(ELEMENT_PREFIX) ? targetElId.slice(ELEMENT_PREFIX.length) : targetElId;
  return { sourceCharacterId, targetCharacterId };
}

interface RelationshipsListProps {
  activeCharacterId: string | null;
  graphEditorRef?: React.RefObject<RelationshipGraphEditorBlankRef | null>;
  characters: CharacterDoc[];
  relationships: RelationshipDoc[];
  onRelationshipsRefresh?: () => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
  activeProjectId?: string | null;
  onGraphChange?: (graph: Record<string, unknown>) => void;
}

function linkToEdge(link: dia.Link, relationship: RelationshipDoc | undefined): RelationshipFlowEdge {
  const src = link.getSourceCell();
  const tgt = link.getTargetCell();
  const sourceId = src?.id?.toString() ?? '';
  const targetId = tgt?.id?.toString() ?? '';
  return {
    id: link.id?.toString() ?? '',
    source: sourceId,
    target: targetId,
    data: {
      label: relationship?.label ?? '',
      why: relationship?.description ?? '',
    },
    relationshipId: relationship?.id,
  };
}

export function RelationshipsList({
  activeCharacterId,
  graphEditorRef,
  characters,
  relationships,
  onRelationshipsRefresh,
  dataAdapter,
  activeProjectId,
  onGraphChange,
}: RelationshipsListProps) {
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editWhy, setEditWhy] = useState('');

  const graph = graphEditorRef?.current?.getGraph() ?? null;
  const links = graph?.getLinks() ?? [];
  const activeElementId = activeCharacterId ? `character-${activeCharacterId}` : '';
  const linksForActive = useMemo(() => {
    if (!activeElementId) return [];
    return links.filter((link: dia.Link) => {
      const src = link.getSourceCell();
      const tgt = link.getTargetCell();
      const sid = src?.id?.toString();
      const tid = tgt?.id?.toString();
      return sid === activeElementId || tid === activeElementId;
    });
  }, [links, activeElementId]);

  const handleEdit = (link: dia.Link, relationship: RelationshipDoc | undefined) => {
    setEditingLinkId(link.id?.toString() ?? null);
    setEditLabel(relationship?.label ?? '');
    setEditWhy(relationship?.description ?? '');
  };

  const handleSave = async (
    linkId: string,
    relationshipId: string | undefined,
    sourceCharacterId: string,
    targetCharacterId: string
  ) => {
    if (!dataAdapter || !activeProjectId) return;
    try {
      if (relationshipId) {
        await dataAdapter.updateRelationship(relationshipId, { label: editLabel, description: editWhy });
      } else {
        await dataAdapter.createRelationship({
          projectId: activeProjectId,
          sourceCharacterId,
          targetCharacterId,
          label: editLabel,
          description: editWhy,
        });
      }
      graphEditorRef?.current?.updateLinkLabel?.(linkId, editLabel);
      await onRelationshipsRefresh?.();
    } catch (err) {
      console.error('Failed to save relationship:', err);
      return;
    }
    setEditingLinkId(null);
  };

  const handleCancel = () => {
    setEditingLinkId(null);
  };

  const handleDelete = async (linkId: string, relationshipId: string | undefined) => {
    const g = graphEditorRef?.current?.getGraph();
    if (!g || !onGraphChange) return;
    const link = g.getCell(linkId) as dia.Link | undefined;
    if (link) {
      g.removeCell(link);
      onGraphChange(g.toJSON() as Record<string, unknown>);
    }
    if (relationshipId && dataAdapter?.deleteRelationship) {
      try {
        await dataAdapter.deleteRelationship(relationshipId);
      } catch (err) {
        console.error('Failed to delete relationship:', err);
      }
    }
    await onRelationshipsRefresh?.();
    setEditingLinkId(null);
  };

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
        const { sourceCharacterId, targetCharacterId } = linkIdToCharacterIds(link);
        const relationship = relationships.find(
          (r) => r.sourceCharacter === sourceCharacterId && r.targetCharacter === targetCharacterId
        );
        const edge = linkToEdge(link, relationship);
        const linkId = link.id?.toString() ?? '';
        const isEditing = editingLinkId === linkId;
        const sourceEl = link.getSourceElement();
        const targetEl = link.getTargetElement();
        return (
          <EdgeRow
            key={edge.id}
            edge={edge}
            sourceName={getCharacterName(characters, sourceEl as dia.Cell)}
            targetName={getCharacterName(characters, targetEl as dia.Cell)}
            isEditing={isEditing}
            editLabel={isEditing ? editLabel : edge.data?.label ?? ''}
            editWhy={isEditing ? editWhy : edge.data?.why ?? ''}
            onEditLabel={setEditLabel}
            onEditWhy={setEditWhy}
            onEdit={() => handleEdit(link, relationship)}
            onSave={() => handleSave(linkId, relationship?.id, sourceCharacterId, targetCharacterId)}
            onCancel={handleCancel}
            onDelete={() => handleDelete(linkId, relationship?.id)}
          />
        );
      })}
    </div>
  );
}
