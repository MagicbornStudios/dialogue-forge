'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import type { RelationshipFlowEdge } from '@/characters/types';

interface EdgeRowProps {
  edge: RelationshipFlowEdge;
  sourceName: string;
  targetName: string;
  isEditing: boolean;
  editLabel: string;
  editWhy: string;
  onEditLabel: (value: string) => void;
  onEditWhy: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function EdgeRow({
  edge,
  sourceName,
  targetName,
  isEditing,
  editLabel,
  editWhy,
  onEditLabel,
  onEditWhy,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: EdgeRowProps) {
  return (
    <div
      className={cn(
        'w-full px-2 py-2 border-b border-border last:border-b-0',
        isEditing && 'bg-muted'
      )}
    >
      {isEditing ? (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground">
            {sourceName} → {targetName}
          </div>
          <div className="space-y-1.5">
            <Input
              value={editLabel}
              onChange={(e) => onEditLabel(e.target.value)}
              placeholder="Relationship label"
              className="h-7 text-xs"
              autoFocus
            />
            <Textarea
              value={editWhy}
              onChange={(e) => onEditWhy(e.target.value)}
              placeholder="Why this relationship exists..."
              className="min-h-[60px] text-xs resize-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={onSave}>
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 text-xs px-2 ml-auto"
              onClick={() => {
                onDelete();
                onCancel();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="group cursor-pointer hover:bg-muted/50 rounded px-1 py-1 -mx-1 transition-colors"
          onClick={onEdit}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted-foreground mb-0.5">
                {sourceName} → {targetName}
              </div>
              {edge.data?.label ? (
                <div className="text-xs font-medium truncate">{edge.data.label}</div>
              ) : (
                <div className="text-xs text-muted-foreground italic">No label</div>
              )}
              {edge.data?.why && (
                <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {edge.data.why}
                </div>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
