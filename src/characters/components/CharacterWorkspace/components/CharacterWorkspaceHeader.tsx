'use client';

import React from 'react';
import { Bug, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import type { ProjectInfo } from '@/characters/types';

export interface CharacterWorkspaceHeaderProps {
  projects: ProjectInfo[];
  isLoadingProjects: boolean;
  selectedProject: ProjectInfo | undefined;
  activeProjectId: string | null;
  onProjectSelect: (project: ProjectInfo) => void;
  onCreateCharacterClick: () => void;
  onDebugClick?: () => void;
}

export function CharacterWorkspaceHeader({
  projects,
  isLoadingProjects,
  selectedProject,
  activeProjectId,
  onProjectSelect,
  onCreateCharacterClick,
  onDebugClick,
}: CharacterWorkspaceHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={isLoadingProjects}>
              <span className="truncate max-w-[120px]">
                {isLoadingProjects ? 'Loading...' : selectedProject ? selectedProject.title : 'No project'}
              </span>
              <ChevronDown className="ml-1.5 h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className={activeProjectId === project.id ? 'bg-accent' : ''}
              >
                {project.title}
              </DropdownMenuItem>
            ))}
            {projects.length === 0 && !isLoadingProjects && (
              <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCreateCharacterClick}
          disabled={!activeProjectId}
          title="Create new character"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
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
