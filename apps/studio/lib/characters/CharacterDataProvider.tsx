'use client';

import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CharacterWorkspaceAdapter } from '@magicborn/characters/types';
import {
  fetchCharacterProjects,
  fetchCharacters,
  fetchRelationships,
  useCreateCharacterProject,
  useUploadCharacterMedia,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
} from './character-queries';
import { CharacterDataContext } from '@magicborn/characters/components/CharacterWorkspace/CharacterDataContext';

type Props = {
  children: React.ReactNode;
};

/**
 * Provides CharacterWorkspaceAdapter implemented via React Query.
 */
export function CharacterDataProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const createProject = useCreateCharacterProject();
  const uploadMedia = useUploadCharacterMedia();
  const createCharacter = useCreateCharacter();
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();
  const createRelationship = useCreateRelationship();
  const updateRelationship = useUpdateRelationship();
  const deleteRelationship = useDeleteRelationship();

  const adapter = useMemo<CharacterWorkspaceAdapter>(
    () => ({
      listProjects: () => fetchCharacterProjects(queryClient),
      createProject: (data) => createProject.mutateAsync(data),
      uploadMedia: (file) => uploadMedia.mutateAsync(file),
      listCharacters: (projectId) => fetchCharacters(queryClient, projectId),
      createCharacter: (projectId, data) => createCharacter.mutateAsync({ projectId, data }),
      updateCharacter: (characterId, patch) => updateCharacter.mutateAsync({ characterId, patch }),
      deleteCharacter: (characterId) =>
        deleteCharacter.mutateAsync(characterId).then(() => undefined),
      listRelationshipsForProject: (projectId) => fetchRelationships(queryClient, projectId),
      createRelationship: (data) => createRelationship.mutateAsync(data),
      updateRelationship: (relationshipId, patch) =>
        updateRelationship.mutateAsync({ relationshipId, patch }),
      deleteRelationship: (relationshipId) =>
        deleteRelationship.mutateAsync(relationshipId).then(() => undefined),
    }),
    [
      queryClient,
      createProject,
      uploadMedia,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      createRelationship,
      updateRelationship,
      deleteRelationship,
    ]
  );

  return (
    <CharacterDataContext.Provider value={adapter}>
      {children}
    </CharacterDataContext.Provider>
  );
}
