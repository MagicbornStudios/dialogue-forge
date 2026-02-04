'use client';

import React from 'react';
import type { VideoTemplate } from '@magicborn/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter, ProjectAdapter } from '@magicborn/video/workspace/video-template-workspace-contracts';
import { VideoWorkspaceTwick } from './VideoWorkspaceTwick';

export interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string;
}

interface VideoWorkspaceProps {
  template?: VideoTemplate | null;
  className?: string;
  contextId?: string;
  onEvent?: (event: any) => void;
  resolveTemplate?: (templateId: string) => Promise<VideoTemplate>;
  adapter?: VideoTemplateWorkspaceAdapter;
  projectAdapter?: ProjectAdapter;
  selectedProjectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
  headerLinks?: HeaderLink[];
}

export function VideoWorkspace({
  template,
  className = '',
  contextId,
  selectedProjectId,
}: VideoWorkspaceProps) {
  const resolvedContextId =
    contextId ?? `video:${selectedProjectId ?? 'default'}:${template?.id ?? 'default'}`;

  return (
    <VideoWorkspaceTwick
      className={className}
      contextId={resolvedContextId}
      width={template?.width ?? 1920}
      height={template?.height ?? 1080}
      frameRate={template?.frameRate ?? 30}
    />
  );
}
