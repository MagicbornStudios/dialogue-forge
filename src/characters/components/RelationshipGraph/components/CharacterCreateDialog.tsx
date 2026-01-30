'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useCharacterWorkspaceStore, useCharacterWorkspaceStoreInstance } from '../../CharacterWorkspace/store/character-workspace-store';

interface CharacterCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterCreateDialog({
  open,
  onOpenChange,
}: CharacterCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const store = useCharacterWorkspaceStoreInstance();
  const dataAdapter = useCharacterWorkspaceStore((s) => s.dataAdapter);
  const activeProjectId = useCharacterWorkspaceStore((s) => s.activeProjectId);

  const handleCreate = async () => {
    if (!name.trim() || !dataAdapter || !activeProjectId) return;

    setIsCreating(true);
    try {
      const newCharacter = await dataAdapter.createCharacter(activeProjectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Add to store
      store.getState().actions.upsertCharacter(newCharacter);

      // Reset form and close
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create character:', error);
      alert('Failed to create character');
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !isCreating && onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create New Character</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => !isCreating && onOpenChange(false)}
            disabled={isCreating}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional character description"
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              disabled={isCreating}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating || !activeProjectId}
            >
              {isCreating ? 'Creating...' : 'Create Character'}
            </Button>
          </div>

          {!activeProjectId && (
            <div className="text-sm text-destructive">
              Please select a project first
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
