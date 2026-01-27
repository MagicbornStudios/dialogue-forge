'use client';

import React from 'react';
import Link from 'next/link';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';
import { Button } from '@/shared/ui/button';
import { Plus, FolderOpen, Film } from 'lucide-react';
import { VideoProjectSwitcher, type ProjectAdapter } from './VideoProjectSwitcher';
import type { HeaderLink } from '../VideoWorkspace';

export interface VideoWorkspaceMenuBarProps {
  headerLinks?: HeaderLink[];
  projectAdapter?: ProjectAdapter;
  onProjectChange?: (projectId: number | null) => void;
}

export function VideoWorkspaceMenuBar({ headerLinks, projectAdapter, onProjectChange }: VideoWorkspaceMenuBarProps) {
  const selectedProjectId = useVideoWorkspaceStore((s) => s.selectedProjectId);
  const draftTemplate = useVideoWorkspaceStore((s) => s.draftGraph);
  const resetDraft = useVideoWorkspaceStore((s) => s.actions.resetDraft);

  const handleNewTemplate = () => {
    if (!selectedProjectId) {
      alert('Please select a project first before creating templates.');
      return;
    }
    
    console.log('Creating new template for project:', selectedProjectId);
    
    // Create a blank template
    const blankTemplate = {
      id: `template_${Date.now()}`,
      name: 'Untitled Template',
      width: 1920,
      height: 1080,
      frameRate: 30,
      scenes: [
        {
          id: 'scene_1',
          name: 'Main Scene',
          durationMs: 5000,
          layers: [],
        },
      ],
    };
    
    resetDraft(blankTemplate);
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Film size={18} className="text-[var(--color-df-video)]" />
          <div className="text-sm font-semibold">Video Workspace</div>
        </div>
        
        {/* Project Switcher */}
        <div className="flex items-center gap-1">
          <VideoProjectSwitcher 
            projectAdapter={projectAdapter}
            onProjectChange={onProjectChange}
          />
        </div>
        
        {draftTemplate && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="text-xs text-muted-foreground font-medium">
              {draftTemplate.name}
            </div>
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleNewTemplate}
          disabled={!selectedProjectId}
          title={!selectedProjectId ? 'Select a project first' : 'Create new template'}
        >
          <Plus size={12} className="mr-1" />
          New Template
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        {headerLinks?.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.target}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.icon}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}