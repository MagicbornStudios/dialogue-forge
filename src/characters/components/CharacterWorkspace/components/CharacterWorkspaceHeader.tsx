'use client';

import React, { useState } from 'react';
import { Bug, Plus, Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ProjectSwitcher } from '@/shared/ui/ProjectSwitcher';
import type { ProjectSummary } from '@/shared/ui/ProjectSwitcher';
import type { ProjectInfo } from '@/characters/types';

export interface CharacterWorkspaceHeaderProps {
  projects: ProjectInfo[];
  isLoadingProjects: boolean;
  activeProjectId: string | null;
  onProjectSelect: (project: ProjectInfo) => void;
  /** When provided, project dropdown shows "New project..." and create dialog is available */
  onCreateProject?: (data: { name: string; description?: string }) => Promise<ProjectInfo>;
  onCreateCharacterClick: () => void;
  onDebugClick?: () => void;
  /** Save current JointJS graph to the active character. Shown only when provided. */
  onSaveGraph?: () => void | Promise<void>;
}

function toSummary(p: ProjectInfo): ProjectSummary {
  return { id: p.id, name: p.title };
}

export function CharacterWorkspaceHeader({
  projects,
  isLoadingProjects,
  activeProjectId,
  onProjectSelect,
  onCreateProject,
  onCreateCharacterClick,
  onDebugClick,
  onSaveGraph,
}: CharacterWorkspaceHeaderProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSaveGraph) return;
    setIsSaving(true);
    try {
      await onSaveGraph();
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjectChange = (id: string | number | null) => {
    if (id === null) return;
    const project = projects.find((p) => p.id === id);
    if (project) onProjectSelect(project);
  };

  const handleCreateProject = onCreateProject
    ? async (data: { name: string; description?: string }): Promise<ProjectSummary> => {
        const p = await onCreateProject(data);
        return toSummary(p);
      }
    : undefined;

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <ProjectSwitcher
          projects={projects.map(toSummary)}
          selectedProjectId={activeProjectId}
          onProjectChange={handleProjectChange}
          onCreateProject={handleCreateProject}
          isLoading={isLoadingProjects}
          variant="compact"
        />

      </div>

      <div className="flex items-center gap-2">
        {onSaveGraph && (
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-1.5"
            onClick={handleSave}
            disabled={isSaving}
            title="Save graph to character"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
        {onDebugClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onDebugClick}
            title="Graph debug (view JSON)"
          >
            <Bug className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('/admin', '_blank')}
          title="Open Payload Admin"
        >
          Admin
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('/api/graphql-playground', '_blank')}
          title="Open GraphQL Playground (API Documentation)"
        >
          API
        </Button>
      </div>
    </div>
  );
}
