'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';

export interface ProjectSummary {
  id: number;
  name: string;
  slug?: string | null;
}

export interface ProjectAdapter {
  listProjects(): Promise<ProjectSummary[]>;
  createProject(input: { name: string; description?: string | null }): Promise<ProjectSummary>;
}

interface VideoProjectSwitcherProps {
  projectAdapter?: ProjectAdapter;
  onProjectChange?: (projectId: number | null) => void;
}

export function VideoProjectSwitcher({ projectAdapter, onProjectChange }: VideoProjectSwitcherProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const selectedProjectId = useVideoWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useVideoWorkspaceStore((s) => s.actions.setSelectedProjectId);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Load projects
  useEffect(() => {
    if (!projectAdapter) return;
    
    setIsLoading(true);
    setError(null);
    projectAdapter.listProjects()
      .then(setProjects)
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects');
      })
      .finally(() => setIsLoading(false));
  }, [projectAdapter]);
  
  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectAdapter) {
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      const projectData = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      };
      
      const createdProject = await projectAdapter.createProject(projectData);
      
      // Refresh projects list
      const updatedProjects = await projectAdapter.listProjects();
      setProjects(updatedProjects);
      
      setIsCreateDialogOpen(false);
      setProjectName('');
      setProjectDescription('');
      
      // Update selected project in store and notify parent
      setSelectedProjectId(createdProject.id);
      if (onProjectChange) {
        onProjectChange(createdProject.id);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleProjectSelect = (project: ProjectSummary) => {
    setSelectedProjectId(project.id);
    if (onProjectChange) {
      onProjectChange(project.id);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={isLoading}>
            <span className="truncate max-w-[120px]">
              {isLoading ? 'Loading...' : selectedProject ? selectedProject.name : 'No project'}
            </span>
            <ChevronDown className="ml-1.5 h-3 w-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
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
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => setIsCreateDialogOpen(true)}
        title="Create new project"
        disabled={!projectAdapter}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your video templates and content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
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
                placeholder="My Video Project"
                disabled={isCreating}
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
                setError(null);
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || isCreating || !projectAdapter}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
