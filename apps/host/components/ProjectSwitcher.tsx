'use client';

import { ChevronDown, Folder, Eye, FileText, File, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@magicborn/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@magicborn/shared/ui/dropdown-menu';
import { ProjectSwitcher as SharedProjectSwitcher, type ProjectSummary } from '@magicborn/shared/ui/ProjectSwitcher';
import { useProjects, useCreateProject, type ProjectDocument } from '../app/lib/forge/queries';

interface WriterMenuHandlers {
  onDownloadMarkdown?: () => void;
  onDownloadPDF?: () => void;
  onToggleFullWidth?: () => void;
  isFullWidth?: boolean;
  canDownload?: boolean;
}

interface ProjectSwitcherProps {
  selectedProjectId: number | null;
  onProjectChange: (projectId: number | null) => void;
  writerMenus?: WriterMenuHandlers;
}

function toSummary(p: ProjectDocument): ProjectSummary {
  return { id: p.id, name: p.name };
}

export function ProjectSwitcher({ selectedProjectId, onProjectChange, writerMenus }: ProjectSwitcherProps) {
  const projectsQuery = useProjects();
  const createProjectMutation = useCreateProject();

  const projects: ProjectSummary[] = (projectsQuery.data ?? []).map(toSummary);
  const isLoading = projectsQuery.isLoading ?? false;

  const handleCreateProject = async (data: { name: string; description?: string }): Promise<ProjectSummary> => {
    const created = await createProjectMutation.mutateAsync(data);
    return toSummary(created);
  };

  const handleProjectChange = (id: ProjectSummary['id'] | null) => {
    onProjectChange(id === null ? null : (id as number));
  };

  const children = (
    <>
      {writerMenus && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span>File</span>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={writerMenus.onDownloadMarkdown}
                    disabled={!writerMenus.canDownload}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={writerMenus.onDownloadPDF}
                    disabled={!writerMenus.canDownload}
                  >
                    <File className="mr-2 h-4 w-4" />
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px] justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={writerMenus.onToggleFullWidth}>
                {writerMenus.isFullWidth ? (
                  <Minimize2 className="mr-2 h-4 w-4" />
                ) : (
                  <Maximize2 className="mr-2 h-4 w-4" />
                )}
                Full width
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
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
    </>
  );

  return (
    <SharedProjectSwitcher
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectChange={handleProjectChange}
      onCreateProject={handleCreateProject}
      isLoading={isLoading}
      error={projectsQuery.error ? 'Failed to load projects' : null}
      variant="full"
    >
      {children}
    </SharedProjectSwitcher>
  );
}
