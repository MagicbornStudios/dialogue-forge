'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@magicborn/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@magicborn/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@magicborn/shared/ui/dropdown-menu';
import { Input } from '@magicborn/shared/ui/input';
import { Label } from '@magicborn/shared/ui/label';

export type ProjectSummary = { id: string | number; name: string };

export interface ProjectSwitcherProps {
  projects: ProjectSummary[];
  selectedProjectId: string | number | null;
  onProjectChange: (projectId: string | number | null) => void;
  onCreateProject?: (data: { name: string; description?: string }) => Promise<ProjectSummary>;
  isLoading?: boolean;
  error?: string | null;
  /** compact: dropdown + plus only. full: label + dropdown + plus + children */
  variant?: 'compact' | 'full';
  children?: React.ReactNode;
}

export function ProjectSwitcher({
  projects,
  selectedProjectId,
  onProjectChange,
  onCreateProject,
  isLoading = false,
  error = null,
  variant = 'compact',
  children,
}: ProjectSwitcherProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleCreateProject = async () => {
    const name = projectName.trim();
    if (!name || !onCreateProject) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await onCreateProject({
        name,
        description: projectDescription.trim() || undefined,
      });
      setIsCreateDialogOpen(false);
      setProjectName('');
      setProjectDescription('');
      onProjectChange(created.id);
    } catch (err) {
      console.error('Failed to create project:', err);
      setCreateError('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleProjectSelect = (project: ProjectSummary) => {
    onProjectChange(project.id);
  };

  const triggerLabel =
    isLoading ? 'Loading...' : selectedProject ? selectedProject.name : 'No project';

  const trigger = (
    <Button
      variant={variant === 'full' ? 'outline' : 'ghost'}
      size={variant === 'full' ? 'default' : 'sm'}
      className={variant === 'full' ? 'min-w-[200px] justify-between' : 'h-7 px-2 text-xs'}
      disabled={isLoading}
    >
      <span className={variant === 'full' ? 'truncate' : 'truncate max-w-[120px]'}>
        {triggerLabel}
      </span>
      <ChevronDown className={variant === 'full' ? 'ml-2 h-4 w-4 shrink-0' : 'ml-1.5 h-3 w-3 shrink-0'} />
    </Button>
  );

  const wrapperClass =
    variant === 'full'
      ? 'flex items-center gap-2 border-b px-4 py-2 bg-background'
      : 'flex items-center gap-2';

  return (
    <>
      <div className={wrapperClass}>
        {variant === 'full' && (
          <span className="text-sm font-medium text-muted-foreground">Project:</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            {projects.map((project) => (
              <DropdownMenuItem
                key={String(project.id)}
                onClick={() => handleProjectSelect(project)}
                className={selectedProjectId === project.id ? 'bg-accent' : ''}
              >
                {project.name}
              </DropdownMenuItem>
            ))}
            {projects.length === 0 && !isLoading && (
              <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
            )}
            {error && (
              <DropdownMenuItem disabled className="text-destructive">
                {error}
              </DropdownMenuItem>
            )}
            {onCreateProject && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                  New project...
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {onCreateProject && (
          <Button
            variant="ghost"
            size="icon"
            className={variant === 'full' ? 'h-9 w-9' : 'h-7 w-7'}
            onClick={() => setIsCreateDialogOpen(true)}
            title="Create new project"
            disabled={isLoading}
          >
            <Plus className={variant === 'full' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          </Button>
        )}
        {children}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your dialogues and narrative content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Game Project"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                A slug will be automatically generated from the project name
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
                placeholder="Optional description of your project..."
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setProjectName('');
                setProjectDescription('');
                setCreateError(null);
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || isCreating || !onCreateProject}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
