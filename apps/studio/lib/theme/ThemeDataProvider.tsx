'use client';

import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ThemeDataAdapter } from '@magicborn/theme/workspace/theme-workspace-contracts';
import { ThemeDataContext } from '@magicborn/theme/components/ThemeWorkspace/ThemeDataContext';
import {
  fetchThemeProjects,
  fetchThemeWorkspaceSettings,
  useCreateThemeProject,
  useSaveThemeWorkspaceSettings,
} from './theme-queries';

export function ThemeDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const createProject = useCreateThemeProject();
  const saveSettings = useSaveThemeWorkspaceSettings();

  const adapter = useMemo<ThemeDataAdapter>(
    () => ({
      listProjects: () => fetchThemeProjects(queryClient),
      createProject: (input) => createProject.mutateAsync(input),
      getThemeWorkspaceSettings: (projectId) =>
        fetchThemeWorkspaceSettings(queryClient, projectId),
      saveThemeWorkspaceSettings: (projectId, settings) =>
        saveSettings.mutateAsync({ projectId, settings }),
    }),
    [createProject, queryClient, saveSettings]
  );

  return <ThemeDataContext.Provider value={adapter}>{children}</ThemeDataContext.Provider>;
}
