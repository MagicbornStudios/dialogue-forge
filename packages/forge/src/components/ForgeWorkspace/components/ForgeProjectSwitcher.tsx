'use client';

import React, { useMemo } from 'react';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import {
  useCreateForgeProject,
  useForgeProjects,
} from '@magicborn/forge/data/forge-queries';
import type { ForgeProjectSummary } from '@magicborn/forge/data/forge-types';
import { ProjectSwitcher } from '@magicborn/shared/ui/ProjectSwitcher';
import type { ProjectSummary } from '@magicborn/shared/ui/ProjectSwitcher';

function toSummary(project: ForgeProjectSummary): ProjectSummary {
  return { id: project.id, name: project.name };
}

function toErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  if (typeof error === 'object') {
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
  return 'Failed to load projects';
}

export function ForgeProjectSwitcher() {
  const selectedProjectId = useForgeWorkspaceStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useForgeWorkspaceStore(
    (state) => state.actions.setSelectedProjectId
  );
  const projectsQuery = useForgeProjects();
  const createProject = useCreateForgeProject();

  const projects = useMemo(
    () => (projectsQuery.data ?? []).map(toSummary),
    [projectsQuery.data]
  );
  const errorMessage = toErrorMessage(projectsQuery.error);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
  }): Promise<ProjectSummary> => {
    const created = await createProject.mutateAsync(data);
    setSelectedProjectId(created.id);
    return toSummary(created);
  };

  const handleProjectChange = (id: string | number | null) => {
    setSelectedProjectId(id == null ? null : Number(id));
  };

  return (
    <ProjectSwitcher
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectChange={handleProjectChange}
      onCreateProject={handleCreateProject}
      isLoading={projectsQuery.isLoading}
      error={errorMessage}
      onRetry={() => {
        void projectsQuery.refetch();
      }}
      variant="compact"
    />
  );
}
