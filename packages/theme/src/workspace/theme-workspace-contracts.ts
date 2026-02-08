import type { ThemeStyleProps, ThemeStyles } from '../theme/theme-schema';

export type ThemeMode = 'light' | 'dark';
export type ThemeToken = keyof ThemeStyleProps;
export type ThemeSource = 'generated' | 'manual' | 'preset';

export type ThemeProjectSummary = {
  id: number;
  name: string;
  slug?: string | null;
};

export type ThemeWorkspaceTheme = {
  id: string;
  name: string;
  styles: ThemeStyles;
  source: ThemeSource;
  createdAt: string;
  updatedAt: string;
};

export type ThemeWorkspaceSettingsV1 = {
  version: 1;
  activeThemeId: string | null;
  themes: ThemeWorkspaceTheme[];
};

export interface ThemeDataAdapter {
  listProjects(): Promise<ThemeProjectSummary[]>;
  createProject(input: { name: string; description?: string | null }): Promise<ThemeProjectSummary>;
  getThemeWorkspaceSettings(projectId: number): Promise<ThemeWorkspaceSettingsV1>;
  saveThemeWorkspaceSettings(
    projectId: number,
    settings: ThemeWorkspaceSettingsV1
  ): Promise<ThemeWorkspaceSettingsV1>;
}

export type ThemeGenerationHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ThemeGenerationInput = {
  prompt: string;
  currentStyles: ThemeStyles;
  history?: ThemeGenerationHistoryMessage[];
};

export type ThemeGenerationResult = {
  assistantText: string;
  themeStyles: ThemeStyles;
  modelUsed: string;
};

export interface ThemeAiAdapter {
  generateTheme(input: ThemeGenerationInput): Promise<ThemeGenerationResult>;
}
