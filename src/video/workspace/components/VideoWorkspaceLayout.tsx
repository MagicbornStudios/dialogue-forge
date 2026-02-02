'use client';

import React from 'react';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';
import { VideoSidebar } from './VideoSidebar/VideoSidebar';
import { OverrideEditor } from './OverrideEditor';

export function VideoWorkspaceLayout() {
  const panelLayout = useVideoWorkspaceStore((s) => s.panelLayout);

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Left Sidebar - Templates/Videos/Elements */}
      {panelLayout.sidebar.visible && (
        <div className="w-[280px] min-w-0 border-r border-border bg-background relative group">
          <div className="absolute inset-y-0 right-0 w-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <VideoSidebar className="h-full" />
        </div>
      )}

      {/* Center - Override Editor with Tabs */}
      <div className="flex-1 min-w-0">
        <OverrideEditor />
      </div>
    </div>
  );
}