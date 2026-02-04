'use client';

import React, { useState, useEffect } from 'react';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import type { ForgeProjectSummary } from '@magicborn/forge/adapters/forge-data-adapter';
import { ProjectSwitcher } from '@magicborn/shared/ui/ProjectSwitcher';
import type { ProjectSummary } from '@magicborn/shared/ui/ProjectSwitcher';

function toSummary(p: ForgeProjectSummary): ProjectSummary {
  return { id: p.id, name: p.name };
}

export function ForgeProjectSwitcher() {
  const [projects, setProjects] = useState<ForgeProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useForgeWorkspaceStore((s) => s.actions.setSelectedProjectId);
  const dataAdapter = useForgeWorkspaceStore((s) => s.dataAdapter);

  useEffect(() => {
    if (!dataAdapter) return;
    setIsLoading(true);
    setError(null);
    dataAdapter
      .listProjects()
      .then(setProjects)
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects');
      })
      .finally(() => setIsLoading(false));
  }, [dataAdapter]);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
  }): Promise<ProjectSummary> => {
    if (!dataAdapter) throw new Error('No adapter');
    const created = await dataAdapter.createProject(data);
    const updated = await dataAdapter.listProjects();
    setProjects(updated);
    setSelectedProjectId(created.id);
    return toSummary(created);
  };

  const handleProjectChange = (id: string | number | null) => {
    setSelectedProjectId(id === null ? null : (id as number));
  };

  return (
    <ProjectSwitcher
      projects={projects.map(toSummary)}
      selectedProjectId={selectedProjectId}
      onProjectChange={handleProjectChange}
      onCreateProject={dataAdapter?.createProject ? handleCreateProject : undefined}
      isLoading={isLoading}
      error={error}
      variant="compact"
    />
  );
}
