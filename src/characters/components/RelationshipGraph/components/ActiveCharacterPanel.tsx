'use client';

import React, { useState } from 'react';
import { User, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { CharacterDoc, CharacterWorkspaceAdapter } from '@/characters/types';

interface ActiveCharacterPanelProps {
  character: CharacterDoc | null | undefined;
  onUpdate?: (updates: { name?: string; description?: string; imageUrl?: string }) => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
}

export function ActiveCharacterPanel({
  character,
  onUpdate,
  dataAdapter,
}: ActiveCharacterPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditedName(character?.name || '');
    setEditedDescription(character?.description || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate || !character) return;

    setIsSaving(true);
    try {
      await onUpdate({
        name: editedName,
        description: editedDescription,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update character:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName('');
    setEditedDescription('');
  };

  if (!character) {
    return (
      <div className="w-64 h-full border-r border-border bg-background p-4">
        <div className="text-center py-8">
          <User className="mx-auto mb-2 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No active character</p>
          <p className="text-xs text-muted-foreground mt-1">
            Select a character from the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-full border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Active Character</h3>
        {!isEditing && onUpdate && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStartEdit}
            title="Edit character"
          >
            <Edit2 size={14} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={4}
                className="w-full px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !editedName.trim()}
                className="flex-1"
              >
                <Save size={14} className="mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Name</div>
              <div className="text-sm font-medium">{character.name}</div>
            </div>

            {character.description && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Description</div>
                <div className="text-sm text-muted-foreground">{character.description}</div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                This is the active character. All relationships originate from this character.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
