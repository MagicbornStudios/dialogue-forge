'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { CreateCharacterForm, type CreateCharacterFormValues } from './CreateCharacterForm';
import { useCharacterWorkspaceStore } from '../store/character-workspace-store';
import type { CharacterWorkspaceAdapter } from '@/characters/types';

export interface CharacterWorkspaceModalsProps {
  dataAdapter?: CharacterWorkspaceAdapter;
}

/**
 * Renders all character workspace modals (create character, etc.).
 * Modal open/close state comes from the store, like ForgeWorkspaceModals.
 */
export function CharacterWorkspaceModals({ dataAdapter }: CharacterWorkspaceModalsProps) {
  const isCreateOpen = useCharacterWorkspaceStore((s) => s.isCreateCharacterModalOpen);
  const closeCreateModal = useCharacterWorkspaceStore((s) => s.actions.closeCreateCharacterModal);
  const activeProjectId = useCharacterWorkspaceStore((s) => s.activeProjectId);
  const actions = useCharacterWorkspaceStore((s) => s.actions);

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubmit = async (data: CreateCharacterFormValues) => {
    if (!dataAdapter || !activeProjectId) return;

    setIsCreating(true);
    try {
      const newCharacter = await dataAdapter.createCharacter(activeProjectId, {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        imageUrl: data.imageUrl?.trim() || undefined,
      });

      actions.upsertCharacter(newCharacter);
      actions.setActiveCharacterId(newCharacter.id);
      closeCreateModal();
    } catch (err) {
      console.error('Failed to create character:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeCreateModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Character</DialogTitle>
            <DialogDescription>
              Add a new character to the project. You can edit relationships after creation.
            </DialogDescription>
          </DialogHeader>
          <CreateCharacterForm
            onSubmit={handleCreateSubmit}
            onCancel={closeCreateModal}
            isSubmitting={isCreating}
            disabled={!activeProjectId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
