/**
 * Project slice for character workspace
 * Manages active project selection
 */

import type { ProjectInfo } from '@/characters/types'

export interface ProjectSlice {
  // State
  activeProjectId: string | null
  projects: ProjectInfo[]
}

export interface ProjectActions {
  setActiveProjectId: (projectId: string | null) => void
  setProjects: (projects: ProjectInfo[]) => void
}

export function createProjectSlice(
  set: any,
  get: any
): ProjectSlice & ProjectActions {
  return {
    // Initial state
    activeProjectId: null,
    projects: [],

    // Actions
    setActiveProjectId: (projectId) => {
      set((state: any) => {
        state.activeProjectId = projectId
      })
    },

    setProjects: (projects) => {
      set((state: any) => {
        state.projects = projects
      })
    },
  }
}
