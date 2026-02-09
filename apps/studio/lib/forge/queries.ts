'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@magicborn/types';
import { PAYLOAD_COLLECTIONS } from '@/payload/collections/enums';
import { payload } from './payload';

export type ProjectDocument = Project;

type ProjectsResponse = {
  docs?: Project[];
  message?: string;
  errors?: Array<{ message?: string }>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown;
      errors?: Array<{ message?: string }>;
    };
    if (typeof candidate.message === 'string' && candidate.message) {
      return candidate.message;
    }
    if (Array.isArray(candidate.errors) && candidate.errors[0]?.message) {
      return candidate.errors[0].message;
    }
  }
  return 'Unknown error';
}

async function findProjectsViaRest(): Promise<Project[]> {
  const response = await fetch(`/api/${PAYLOAD_COLLECTIONS.PROJECTS}?limit=200&depth=0`, {
    method: 'GET',
    credentials: 'include',
  });

  let body: ProjectsResponse | undefined;
  try {
    body = (await response.json()) as ProjectsResponse;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const message =
      body?.errors?.[0]?.message ?? body?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return Array.isArray(body?.docs) ? body.docs : [];
}

async function createProjectViaRest(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  const response = await fetch(`/api/${PAYLOAD_COLLECTIONS.PROJECTS}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  let body: Record<string, unknown> | undefined;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const errors = (body?.errors as Array<{ message?: string }> | undefined) ?? [];
    const message =
      errors[0]?.message ??
      (typeof body?.message === 'string' ? body.message : `Request failed: ${response.status}`);
    throw new Error(message);
  }

  return body as unknown as Project;
}

/**
 * React Query hook to fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    queryFn: async () => {
      try {
        const result = await payload.find({
          collection: PAYLOAD_COLLECTIONS.PROJECTS,
          limit: 200,
          depth: 0,
        });
        return (result.docs ?? []) as Project[];
      } catch (sdkError) {
        // Fallback to raw REST call if SDK transport/pathing fails in dev runtime.
        try {
          return await findProjectsViaRest();
        } catch (restError) {
          const sdkMessage = getErrorMessage(sdkError);
          const restMessage = getErrorMessage(restError);
          throw new Error(`Projects query failed. SDK: ${sdkMessage}. REST: ${restMessage}`);
        }
      }
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
      try {
        const created = await payload.create({
          collection: PAYLOAD_COLLECTIONS.PROJECTS,
          data,
        });
        return created as Project;
      } catch (sdkError) {
        return createProjectViaRest(data);
      }
    },
    onSuccess: () => {
      // Invalidate projects query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      // Keep this available in dev tools when payload REST/SDK contract shifts.
      console.error('Failed to create project:', getErrorMessage(error));
    },
  });
}
