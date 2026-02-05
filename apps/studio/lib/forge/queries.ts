'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@magicborn/types';
import { PAYLOAD_COLLECTIONS } from '@/payload/collections/enums';
import { payload } from './payload';

export type ProjectDocument = Project;

/**
 * React Query hook to fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        limit: 200,
      });
      return result.docs as Project[];
    },
  });
}

/**
 * React Query mutation hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const created = await payload.create({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        data,
      });
      return created as Project;
    },
    onSuccess: () => {
      // Invalidate projects query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
