'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@magicborn/types';
import type {
  ThemeProjectSummary,
  ThemeWorkspaceSettingsV1,
} from '@magicborn/theme/workspace/theme-workspace-contracts';
import { normalizeThemeWorkspaceSettings } from '@magicborn/theme/theme/theme-settings';
import { PAYLOAD_COLLECTIONS } from '@/payload/collections/enums';
import { payload } from '@/lib/forge/payload';

export const themeQueryKeys = {
  all: ['theme'] as const,
  projects: () => [...themeQueryKeys.all, 'projects'] as const,
  project: (projectId: number) => [...themeQueryKeys.all, 'project', projectId] as const,
  workspaceSettings: (projectId: number) =>
    [...themeQueryKeys.all, 'workspaceSettings', projectId] as const,
};

type QueryClientLike = {
  fetchQuery: <T>(opts: { queryKey: readonly unknown[]; queryFn: () => Promise<T> }) => Promise<T>;
};

function mapProjectSummary(project: Project): ThemeProjectSummary {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug ?? null,
  };
}

function getProjectSettingsRecord(project: Project): Record<string, unknown> {
  const settings = project.settings;
  if (typeof settings === 'object' && settings !== null && !Array.isArray(settings)) {
    return settings as Record<string, unknown>;
  }
  return {};
}

function getThemeWorkspaceRaw(project: Project): unknown {
  const settingsRecord = getProjectSettingsRecord(project);
  return settingsRecord.themeWorkspace;
}

export async function fetchThemeProjects(
  queryClient: QueryClientLike
): Promise<ThemeProjectSummary[]> {
  return queryClient.fetchQuery({
    queryKey: themeQueryKeys.projects(),
    queryFn: async () => {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        limit: 200,
      });

      return result.docs.map((doc) => mapProjectSummary(doc as Project));
    },
  });
}

export async function fetchThemeWorkspaceSettings(
  queryClient: QueryClientLike,
  projectId: number
): Promise<ThemeWorkspaceSettingsV1> {
  return queryClient.fetchQuery({
    queryKey: themeQueryKeys.workspaceSettings(projectId),
    queryFn: async () => {
      const project = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        id: projectId,
      })) as Project;

      return normalizeThemeWorkspaceSettings(getThemeWorkspaceRaw(project));
    },
  });
}

export async function saveThemeWorkspaceSettings(
  projectId: number,
  settings: ThemeWorkspaceSettingsV1
): Promise<ThemeWorkspaceSettingsV1> {
  const normalized = normalizeThemeWorkspaceSettings(settings);

  const project = (await payload.findByID({
    collection: PAYLOAD_COLLECTIONS.PROJECTS,
    id: projectId,
  })) as Project;

  const existingSettings = getProjectSettingsRecord(project);
  const nextSettings = {
    ...existingSettings,
    themeWorkspace: normalized,
  };

  const updated = (await payload.update({
    collection: PAYLOAD_COLLECTIONS.PROJECTS,
    id: projectId,
    data: {
      settings: nextSettings,
    },
  })) as Project;

  return normalizeThemeWorkspaceSettings(getThemeWorkspaceRaw(updated));
}

export function useCreateThemeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null }) => {
      const created = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        data: input,
      })) as Project;

      return mapProjectSummary(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: themeQueryKeys.projects() });
    },
  });
}

export function useSaveThemeWorkspaceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      settings,
    }: {
      projectId: number;
      settings: ThemeWorkspaceSettingsV1;
    }) => {
      return saveThemeWorkspaceSettings(projectId, settings);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: themeQueryKeys.workspaceSettings(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: themeQueryKeys.project(variables.projectId) });
    },
  });
}
