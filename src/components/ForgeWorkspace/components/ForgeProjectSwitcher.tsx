'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useProjects, useCreateProject, type ProjectDocument } from '@/app/lib/forge/queries';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';

export function ForgeProjectSwitcher() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  const projectsQuery = useProjects();
  const createProjectMutation = useCreateProject();
  
  const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useForgeWorkspaceStore((s) => s.actions.setSelectedProjectId);
  
  const selectedProject = projectsQuery.data?.find(p => p.id === selectedProjectId);
  
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      return;
    }
    
    try {
      const projectData = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      };
      
      const createdProject = await createProjectMutation.mutateAsync(projectData);
      
      setIsCreateDialogOpen(false);
      setProjectName('');
      setProjectDescription('');
      setSelectedProjectId(createdProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };
  
  const handleProjectSelect = (project: ProjectDocument) => {
    setSelectedProjectId(project.id);
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <span className="truncate max-w-[120px]">
              {selectedProject ? selectedProject.name : 'No project'}
            </span>
            <ChevronDown className="ml-1.5 h-3 w-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {projectsQuery.data?.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className={selectedProjectId === project.id ? 'bg-accent' : ''}
            >
              {project.name}
            </DropdownMenuItem>
          ))}
          {projectsQuery.data?.length === 0 && (
            <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => setIsCreateDialogOpen(true)}
        title="Create new project"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your dialogues and narrative content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name *
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="My Game Project"
              />
              <p className="text-xs text-muted-foreground">
                A slug will be automatically generated from the project name
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
                placeholder="Optional description of your project..."
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
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
