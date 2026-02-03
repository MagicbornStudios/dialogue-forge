'use client';

import { Download, Settings, Code, Video, Zap, Play, Pause, Maximize2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoTemplateWorkspace } from '@/src/video/workspace/VideoTemplateWorkspace';
import { makePayloadVideoTemplateAdapter } from '@/app/lib/video/payload-video-template-adapter';
import { CopilotKitProvider } from '@/ai/copilotkit';
import { useVideoWorkspaceActions } from './copilot/useVideoWorkspaceActions';
import type { VideoWorkspaceActionHandlers } from './copilot/actions';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

// Helper function to create template IDs
const createTemplateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `template_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

function VideoStudioCopilotActions({ handlers }: { handlers: VideoWorkspaceActionHandlers }) {
  useVideoWorkspaceActions(handlers);
  return null;
}

export function VideoStudio() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const videoTemplateAdapter = useMemo(
    () =>
      makePayloadVideoTemplateAdapter({
        projectId: selectedProjectId ?? undefined,
      }),
    [selectedProjectId]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // TODO: Implement handlers from workspace store/adapter
  const videoWorkspaceHandlers = useMemo<VideoWorkspaceActionHandlers>(() => ({
    addScene: () => { console.log('addScene not implemented'); },
    addLayer: () => { console.log('addLayer not implemented'); },
    deleteScene: () => { console.log('deleteScene not implemented'); },
    deleteLayer: () => { console.log('deleteLayer not implemented'); },
    duplicateScene: () => { console.log('duplicateScene not implemented'); },
    updateLayerTiming: () => { console.log('updateLayerTiming not implemented'); },
    updateLayerOpacity: () => { console.log('updateLayerOpacity not implemented'); },
    bindLayerInput: () => { console.log('bindLayerInput not implemented'); },
    setDuration: () => { console.log('setDuration not implemented'); },
    setTemplateMetadata: () => { console.log('setTemplateMetadata not implemented'); },
    renameTemplate: () => { console.log('renameTemplate not implemented'); },
    loadPreset: () => { console.log('loadPreset not implemented'); },
    exportVideo: () => { console.log('exportVideo not implemented'); },
  }), []);

  return (
    <CopilotKitProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Left Sidebar - Template Selector and Tools */}
          <div className="w-[280px] min-w-0 border-r border-[var(--video-workspace-border)] flex-shrink-0 relative group">
            <div className="absolute inset-y-0 right-0 w-[1px] bg-[var(--video-workspace-border)] opacity-0 group-hover:opacity-100" />
            
            <VideoTemplateWorkspace
              adapter={videoTemplateAdapter}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={(template) => setSelectedTemplateId(template?.id ?? null)}
            />
          </div>

          {/* Center Panel - Visual Canvas Area */}
          <div className="flex-1 min-w-0">
            <div className="flex-1 border-b border-[var(--video-workspace-border)] min-h-0">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] p-4">
                Visual Canvas - Template Editing Interface
              </div>
              <div className="flex-1 min-h-0">
                <div className="text-sm text-[var(--video-workspace-text-muted)] text-center p-8">
                  <span className="text-xs text-[var(--video-workspace-text-muted)]">
                    Phase 1 complete: Canva/Remotion Studio-like video editor with three-panel layout, parameterized templates, visual canvas, element library, property inspector, and AI integration
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Preview and Export */}
          <div className="w-80 border-l border-[var(--video-workspace-border)] overflow-y-auto">
            <div className="p-4">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] mb-4">Preview & Export</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)]">
                Video preview functionality ready for Phase 2 implementation
              </div>
            </div>
          </div>
        </div>
      </div>
      <VideoStudioCopilotActions handlers={videoWorkspaceHandlers} />
    </CopilotKitProvider>
  );
}