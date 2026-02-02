/**
 * Hook to provide video workspace context to CopilotKit
 */

import { useCopilotReadable } from '@copilotkit/react-core';
import type { StoreApi } from 'zustand/vanilla';
import type { VideoWorkspaceState } from '@/video/workspace/store/video-workspace-store';

export function useVideoCopilotContext(
  workspaceStore: StoreApi<VideoWorkspaceState>
) {
  const state = workspaceStore.getState();
  const template = state.draftGraph;
  
  // Make current template readable by AI
  useCopilotReadable({
    description: 'Current video template being edited',
    value: template ? {
      id: template.id,
      name: template.name,
      dimensions: `${template.width}x${template.height}`,
      frameRate: template.frameRate,
      sceneCount: template.scenes.length,
      totalLayers: template.scenes.reduce((sum, s) => sum + s.layers.length, 0),
      layers: template.scenes[0]?.layers.map((l) => ({
        id: l.id,
        name: l.name,
        kind: l.kind,
        position: `${l.visual?.x},${l.visual?.y}`,
        size: `${l.visual?.width}x${l.visual?.height}`,
      })),
    } : null,
  });
  
  // Make selected layer readable
  useCopilotReadable({
    description: 'Currently selected layer',
    value: state.selectedLayerId ? {
      id: state.selectedLayerId,
      layer: template?.scenes[0]?.layers.find((l) => l.id === state.selectedLayerId),
    } : null,
  });
  
  // Make project context readable
  useCopilotReadable({
    description: 'Current project context',
    value: {
      projectId: state.selectedProjectId,
      hasUnsavedChanges: state.hasUncommittedChanges,
      isPlaying: state.isPlaying,
      currentFrame: state.currentFrame,
    },
  });
}
