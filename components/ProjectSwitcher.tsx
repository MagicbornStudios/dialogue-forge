'use client';

import { useState } from 'react';
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

interface ProjectSwitcherProps {
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
}

export function ProjectSwitcher({ selectedProjectId, onProjectChange }: ProjectSwitcherProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  const projectsQuery = useProjects();
  const createProjectMutation = useCreateProject();
  
  const selectedProject = projectsQuery.data?.find(p => p.id === selectedProjectId);
  
  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectSlug.trim()) {
      return;
    }
    
    try {
      const newProject = await createProjectMutation.mutateAsync({
        name: projectName.trim(),
        slug: projectSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: projectDescription.trim() || undefined,
      });
      
      setIsCreateDialogOpen(false);
      setProjectName('');
      setProjectSlug('');
      setProjectDescription('');
      onProjectChange(newProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };
  
  const handleProjectSelect = (project: ProjectDocument) => {
    onProjectChange(project.id);
  };
  
  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 bg-background">
      <span className="text-sm font-medium text-muted-foreground">Project:</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-between">
            <span className="truncate">
              {selectedProject ? selectedProject.name : 'No project selected'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
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
        onClick={() => setIsCreateDialogOpen(true)}
        title="Create new project"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your dialogues, threads, and narrative content.
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
                onChange={(e) => {
                  setProjectName(e.target.value);
                  // Auto-generate slug from name if slug is empty
                  if (!projectSlug) {
                    setProjectSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="My Game Project"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-slug" className="text-sm font-medium">
                Slug *
              </label>
              <input
                id="project-slug"
                type="text"
                value={projectSlug}
                onChange={(e) => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                placeholder="my-game-project"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (lowercase, hyphens only)
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
                setProjectSlug('');
                setProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || !projectSlug.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
