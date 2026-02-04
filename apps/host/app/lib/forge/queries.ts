'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayloadSDK } from '@payloadcms/sdk';
import type { Project } from '../../payload-types';
import { PAYLOAD_COLLECTIONS } from '../../payload-collections/enums';

// Export ProjectDocument type alias for convenience
export type ProjectDocument = Project;

// Create singleton PayloadSDK instance for client-side REST calls
const payload = new PayloadSDK({
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api',
});

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
