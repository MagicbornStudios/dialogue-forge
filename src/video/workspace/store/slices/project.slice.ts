import type { StateCreator } from 'zustand';
import type { VideoWorkspaceState } from '../video-workspace-store';

export interface ProjectSlice {
  selectedProjectId: number | null;
}

export interface ProjectActions {
  setSelectedProjectId: (id: number | null) => void;
}

export function createProjectSlice(
  set: Parameters<StateCreator<VideoWorkspaceState, [], [], VideoWorkspaceState>>[0],
  get: Parameters<StateCreator<VideoWorkspaceState, [], [], VideoWorkspaceState>>[1],
  initialProjectId?: number | null
): ProjectSlice & ProjectActions {
  return {
    selectedProjectId: initialProjectId ?? null,
    
    setSelectedProjectId: (id: number | null) => {
      const state = get();
      set({ selectedProjectId: id });
      
      // Emit event when project changes
      state.eventSink?.emit({
        type: 'project.changed',
        payload: { projectId: id },
      });
    },
  };
}