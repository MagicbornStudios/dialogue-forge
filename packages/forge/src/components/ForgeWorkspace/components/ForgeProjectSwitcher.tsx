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
      error={projectsQuery.error ? 'Failed to load projects' : null}
      variant="compact"
    />
  );
}
