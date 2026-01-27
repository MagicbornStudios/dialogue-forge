'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter } from '@/video/workspace/video-template-workspace-contracts';
import { VideoWorkspaceMenuBar } from '@/video/workspace/components/VideoWorkspaceMenuBar';
import { VideoWorkspaceToolbar } from '@/video/workspace/components/VideoWorkspaceToolbar';
import { VideoWorkspaceLayout } from '@/video/workspace/components/VideoWorkspaceLayout';
import { VideoWorkspaceModals } from '@/video/workspace/components/VideoWorkspaceModals';
import { ElementDragProvider } from '@/video/workspace/hooks/useElementDrag';
import {
  VideoWorkspaceStoreProvider,
  createVideoWorkspaceStore,
  useVideoWorkspaceStore,
  type EventSink,
} from '@/video/workspace/store/video-workspace-store';
import { setupVideoWorkspaceSubscriptions } from '@/video/workspace/store/slices/subscriptions';
import { CopilotKitProvider } from '@/ai/copilotkit';
import { DEFAULT_BLANK_TEMPLATE } from '@/video/templates/default-templates';
import { useVideoWorkspaceActions, useVideoCopilotContext } from './copilot';

export interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string;
}

export interface ProjectAdapter {
  listProjects(): Promise<Array<{ id: number; name: string; slug?: string | null }>>;
  createProject(input: { name: string; description?: string | null }): Promise<{ id: number; name: string; slug?: string | null }>;
}

interface VideoWorkspaceProps {
  // Initial template (host-provided)
  template?: VideoTemplate | null;
  
  className?: string;
  
  onEvent?: (event: any) => void;
  
  // Optional template resolver (if you lazy-load by id)
  resolveTemplate?: (templateId: string) => Promise<VideoTemplate>;
  
  // Persistence surface (already implemented)
  adapter?: VideoTemplateWorkspaceAdapter;
  
  // Project adapter (for project switching)
  projectAdapter?: ProjectAdapter;
  
  // Project selection sync
  selectedProjectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
  
  // Optional header links (Admin, API, etc.)
  headerLinks?: HeaderLink[];
}

export function VideoWorkspace({
  template,
  className = '',
  onEvent,
  resolveTemplate,
  adapter,
  projectAdapter,
  selectedProjectId,
  onProjectChange,
  headerLinks,
}: VideoWorkspaceProps) {
  const eventSinkRef = useRef<EventSink>({
    emit: (event) => {
      if (onEvent) {
        onEvent(event);
      }
    },
  });

  const storeRef = useRef(
    createVideoWorkspaceStore(
      {
        initialTemplate: template ?? DEFAULT_BLANK_TEMPLATE,
        initialTemplateId: template?.id ?? DEFAULT_BLANK_TEMPLATE.id,
        resolveTemplate,
        adapter,
        selectedProjectId: selectedProjectId ?? null,
      },
      eventSinkRef.current
    )
  );

  // Setup subscriptions
  useEffect(() => {
    const cleanup = setupVideoWorkspaceSubscriptions(storeRef.current);
    return cleanup;
  }, []);

  // Sync project ID from props
  useEffect(() => {
    const store = storeRef.current;
    const currentProjectId = store.getState().selectedProjectId;
    
    if (selectedProjectId !== currentProjectId) {
      store.getState().actions.setSelectedProjectId(selectedProjectId ?? null);
    }
  }, [selectedProjectId]);

  // Sync adapter from props (when project changes, adapter is recreated)
  useEffect(() => {
    const store = storeRef.current;
    if (adapter && store.getState().adapter !== adapter) {
      store.setState({ adapter });
    }
  }, [adapter]);

  // Emit project change events
  useEffect(() => {
    const store = storeRef.current;
    let prevProjectId = store.getState().selectedProjectId;
    
    const unsubscribe = store.subscribe((state) => {
      if (state.selectedProjectId !== prevProjectId) {
        if (onProjectChange) {
          onProjectChange(state.selectedProjectId);
        }
        prevProjectId = state.selectedProjectId;
      }
    });
    
    return unsubscribe;
  }, [onProjectChange]);

  return (
    <VideoWorkspaceStoreProvider store={storeRef.current}>
      <CopilotKitProvider
        instructions="You are an AI assistant for the Video workspace. Help users create and edit video templates, manage layers, and design professional video content."
        defaultOpen={false}
      >
        <VideoWorkspaceActionsWrapper store={storeRef.current}>
          <ElementDragProvider>
          <div 
            className={`flex h-full w-full flex-col ${className}`}
            data-domain="video"
          >
            <VideoWorkspaceMenuBar 
              headerLinks={headerLinks}
              projectAdapter={projectAdapter}
              onProjectChange={onProjectChange}
            />
            <VideoWorkspaceToolbar />
            <VideoWorkspaceLayout />
            <VideoWorkspaceModals />
          </div>
        </ElementDragProvider>
        </VideoWorkspaceActionsWrapper>
      </CopilotKitProvider>
    </VideoWorkspaceStoreProvider>
  );
}

// Wrapper component to register Copilot actions
function VideoWorkspaceActionsWrapper({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createVideoWorkspaceStore>;
}) {
  useVideoWorkspaceActions(store);
  useVideoCopilotContext(store);
  return <>{children}</>;
}