'use client';

import React, { useCallback } from 'react';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';
import { VideoSidebar } from './VideoSidebar/VideoSidebar';
import { VideoCanvas } from './VideoCanvas';
import { PropertyInspector } from './PropertyInspector';
import { VideoTimeline } from './VideoTimeline';
import type { VideoLayer } from '@/video/templates/types/video-layer';

export function VideoWorkspaceLayout() {
  const panelLayout = useVideoWorkspaceStore((s) => s.panelLayout);
  const selectedLayerId = useVideoWorkspaceStore((s) => s.selectedLayerId);
  const showGrid = useVideoWorkspaceStore((s) => s.showGrid);
  
  // Get active template from draft (this is the working copy)
  const activeTemplate = useVideoWorkspaceStore((s) => s.draftGraph);
  
  // Timeline state
  const currentFrame = useVideoWorkspaceStore((s) => s.currentFrame);
  const isPlaying = useVideoWorkspaceStore((s) => s.isPlaying);
  const setCurrentFrame = useVideoWorkspaceStore((s) => s.actions.setCurrentFrame);
  const setIsPlaying = useVideoWorkspaceStore((s) => s.actions.setIsPlaying);
  
  // Store actions
  const setSelectedLayerId = useVideoWorkspaceStore((s) => s.actions.setSelectedLayerId);
  const moveLayer = useVideoWorkspaceStore((s) => s.actions.moveLayer);
  const resizeLayer = useVideoWorkspaceStore((s) => s.actions.resizeLayer);
  const addLayer = useVideoWorkspaceStore((s) => s.actions.addLayer);
  const updateLayer = useVideoWorkspaceStore((s) => s.actions.updateLayer);
  
  // Get selected layer
  const selectedLayer = activeTemplate?.scenes[0]?.layers.find((l) => l.id === selectedLayerId) ?? null;
  
  // Canvas handlers
  const handleLayerSelect = useCallback((layerId: string | null) => {
    setSelectedLayerId(layerId);
  }, [setSelectedLayerId]);
  
  const handleLayerMove = useCallback((layerId: string, x: number, y: number) => {
    moveLayer(layerId, x, y);
  }, [moveLayer]);
  
  const handleLayerResize = useCallback((layerId: string, width: number, height: number) => {
    resizeLayer(layerId, width, height);
  }, [resizeLayer]);
  
  const handleLayerAdd = useCallback((layer: Partial<VideoLayer>) => {
    addLayer(layer);
  }, [addLayer]);

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Left Sidebar - Templates/Videos/Elements */}
      {panelLayout.sidebar.visible && (
        <div className="w-[280px] min-w-0 border-r border-border bg-background relative group">
          <div className="absolute inset-y-0 right-0 w-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <VideoSidebar className="h-full" />
        </div>
      )}

      {/* Center Canvas Area + Inspector */}
      <div className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <VideoCanvas
              template={activeTemplate}
              selectedLayerId={selectedLayerId}
              showGrid={showGrid}
              onLayerSelect={handleLayerSelect}
              onLayerMove={handleLayerMove}
              onLayerResize={handleLayerResize}
              onLayerAdd={handleLayerAdd}
            />
          </div>
          
          {/* Timeline Panel */}
          <div className="h-[200px] border-t border-border relative group">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <VideoTimeline
              template={activeTemplate}
              currentFrame={currentFrame}
              isPlaying={isPlaying}
              selectedLayerId={selectedLayerId}
              onFrameChange={setCurrentFrame}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              onLayerSelect={handleLayerSelect}
            />
          </div>
        </div>

        {/* Property Inspector (Right Panel) */}
        {selectedLayerId && selectedLayer && (
          <div 
            className="w-80 border-l border-border bg-background relative group animate-in slide-in-from-right duration-200"
          >
            <div className="absolute inset-y-0 left-0 w-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <div className="relative h-full">
              {/* Close button */}
              <button
                onClick={() => handleLayerSelect(null)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Close inspector"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              <PropertyInspector
                layer={selectedLayer}
                onUpdate={updateLayer}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}