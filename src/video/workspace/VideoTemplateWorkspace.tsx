'use client';

import React from 'react';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { ProjectAdapter, VideoTemplateWorkspaceAdapter } from './video-template-workspace-contracts';
import { VideoWorkspace } from './VideoWorkspace';

export interface VideoTemplateWorkspaceProps {
  className?: string;
  template?: VideoTemplate | null;
  selectedTemplateId?: string | null;
  adapter?: VideoTemplateWorkspaceAdapter;
  projectAdapter?: ProjectAdapter;
  selectedProjectId?: number | null;
  contextId?: string;
  onTemplateChange?: (template: VideoTemplate | null) => void;
  onSaveTemplate?: () => void;
  onEvent?: (event: unknown) => void;
}

/**
 * Deprecated compatibility wrapper. The Twick-backed VideoWorkspace is the canonical editor.
 */
export function VideoTemplateWorkspace(props: VideoTemplateWorkspaceProps) {
  const { className, template, selectedTemplateId, contextId, selectedProjectId } = props;
  const resolvedContextId =
    contextId ?? `video:${selectedProjectId ?? 'default'}:${selectedTemplateId ?? template?.id ?? 'default'}`;

  return (
    <VideoWorkspace
      className={className}
      template={template}
      contextId={resolvedContextId}
      selectedProjectId={selectedProjectId}
    />
  );
}
