'use client';

import React, { useCallback, useMemo } from 'react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { VideoCanvas } from '../VideoCanvas';
import { VideoTimeline } from '../VideoTimeline';
import { LevaPropertyInspector } from '../PropertyInspector/LevaPropertyInspector';
import type { VideoLayer } from '@/video/templates/types/video-layer';

export function DefaultTab() {
  const draftTemplate = useVideoWorkspaceStore((s) => s.draftGraph);
  const selectedLayerId = useVideoWorkspaceStore((s) => s.selectedLayerId);
  const showGrid = useVideoWorkspaceStore((s) => s.showGrid);
  const currentFrame = useVideoWorkspaceStore((s) => s.currentFrame);
  const isPlaying = useVideoWorkspaceStore((s) => s.isPlaying);
  
  // Actions
  const setSelectedLayerId = useVideoWorkspaceStore((s) => s.actions.setSelectedLayerId);
  const moveLayer = useVideoWorkspaceStore((s) => s.actions.moveLayer);
  const resizeLayer = useVideoWorkspaceStore((s) => s.actions.resizeLayer);
  const addLayer = useVideoWorkspaceStore((s) => s.actions.addLayer);
  const updateLayer = useVideoWorkspaceStore((s) => s.actions.updateLayer);
  const updateLayerStart = useVideoWorkspaceStore((s) => s.actions.updateLayerStart);
  const updateLayerDuration = useVideoWorkspaceStore((s) => s.actions.updateLayerDuration);
  const updateSceneDuration = useVideoWorkspaceStore((s) => s.actions.updateSceneDuration);
  const setCurrentFrame = useVideoWorkspaceStore((s) => s.actions.setCurrentFrame);
  const setIsPlaying = useVideoWorkspaceStore((s) => s.actions.setIsPlaying);
  
  // Get selected layer from all scenes
  const selectedLayer = useMemo(() => {
    if (!draftTemplate || !selectedLayerId) return null;
    
    // Search through all scenes to find the layer
    for (const scene of draftTemplate.scenes) {
      const layer = scene.layers.find((l) => l.id === selectedLayerId);
      if (layer) return layer;
    }
    return null;
  }, [draftTemplate, selectedLayerId]);
  
  // Handlers
  const handleLayerSelect = useCallback((layerId: string | null) => {
    console.log('🎯 DefaultTab handleLayerSelect:', layerId);
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
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          <VideoCanvas
            template={draftTemplate}
            selectedLayerId={selectedLayerId}
            showGrid={showGrid}
            currentFrame={currentFrame}
            frameRate={draftTemplate?.frameRate ?? 30}
            onLayerSelect={handleLayerSelect}
            onLayerMove={handleLayerMove}
            onLayerResize={handleLayerResize}
            onLayerAdd={handleLayerAdd}
          />
        </div>
        
        {/* Timeline */}
        <div className="h-[200px] border-t border-border relative group">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <VideoTimeline
            template={draftTemplate}
            currentFrame={currentFrame}
            isPlaying={isPlaying}
            selectedLayerId={selectedLayerId}
            onFrameChange={setCurrentFrame}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onLayerSelect={handleLayerSelect}
            onLayerStartChange={updateLayerStart}
            onLayerDurationChange={updateLayerDuration}
            onSceneDurationChange={updateSceneDuration}
          />
        </div>
      </div>

      {/* Leva Property Inspector - Embedded in sidebar */}
      {selectedLayerId && selectedLayer ? (
        <div className="w-[300px] border-l border-border flex-shrink-0">
          <LevaPropertyInspector
            key={`${selectedLayerId}-${Math.round(selectedLayer.visual?.x ?? 0)}-${Math.round(selectedLayer.visual?.y ?? 0)}-${Math.round(selectedLayer.visual?.width ?? 200)}-${Math.round(selectedLayer.visual?.height ?? 200)}`}
            layer={selectedLayer}
            onUpdate={updateLayer}
            onClose={() => handleLayerSelect(null)}
          />
        </div>
      ) : (
        <div className="w-[300px] border-l border-border flex-shrink-0 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Select a layer to edit properties</div>
        </div>
      )}
    </div>
  );
}
