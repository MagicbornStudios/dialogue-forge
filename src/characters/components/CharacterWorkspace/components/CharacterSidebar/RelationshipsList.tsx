'use client';

import React from 'react';
import { EdgeRow } from './EdgeRow';
import type { RelationshipFlowEdge } from '@/characters/types';

interface RelationshipsListProps {
  activeCharacterId: string | null;
  edges: RelationshipFlowEdge[];
  filteredEdges: RelationshipFlowEdge[];
  searchQuery: string;
  editingEdgeId: string | null;
  edgeLabel: string;
  edgeWhy: string;
  getCharacterName: (id: string) => string;
  onEditEdge: (edge: RelationshipFlowEdge) => void;
  onSaveEdge: () => void;
  onCancelEdge: () => void;
  onDeleteEdge: (edgeId: string) => void;
  onEdgeLabelChange: (value: string) => void;
  onEdgeWhyChange: (value: string) => void;
}

export function RelationshipsList({
  activeCharacterId,
  edges,
  filteredEdges,
  searchQuery,
  editingEdgeId,
  edgeLabel,
  edgeWhy,
  getCharacterName,
  onEditEdge,
  onSaveEdge,
  onCancelEdge,
  onDeleteEdge,
  onEdgeLabelChange,
  onEdgeWhyChange,
}: RelationshipsListProps) {
  if (!activeCharacterId) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        Select a character to view relationships
      </div>
    );
  }
  if (edges.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        {searchQuery ? 'No relationships found' : 'No relationships yet'}
      </div>
    );
  }

  return (
    <div className="py-1">
      {filteredEdges.map((edge) => (
        <EdgeRow
          key={edge.id}
          edge={edge}
          sourceName={getCharacterName(edge.source)}
          targetName={getCharacterName(edge.target)}
          isEditing={editingEdgeId === edge.id}
          editLabel={edgeLabel}
          editWhy={edgeWhy}
          onEditLabel={onEdgeLabelChange}
          onEditWhy={onEdgeWhyChange}
          onEdit={() => onEditEdge(edge)}
          onSave={onSaveEdge}
          onCancel={onCancelEdge}
          onDelete={() => onDeleteEdge(edge.id)}
        />
      ))}
    </div>
  );
}
