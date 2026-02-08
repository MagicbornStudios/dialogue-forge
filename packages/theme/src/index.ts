export { ThemeWorkspace } from './components/ThemeWorkspace/ThemeWorkspace';
export { ThemeDataContext, useThemeDataContext } from './components/ThemeWorkspace/ThemeDataContext';

export type {
  ThemeAiAdapter,
  ThemeDataAdapter,
  ThemeGenerationHistoryMessage,
  ThemeGenerationInput,
  ThemeGenerationResult,
  ThemeMode,
  ThemeProjectSummary,
  ThemeSource,
  ThemeToken,
  ThemeWorkspaceSettingsV1,
  ThemeWorkspaceTheme,
} from './workspace/theme-workspace-contracts';

export {
  THEME_WORKSPACE_SETTINGS_VERSION,
  createDefaultTheme,
  createDefaultThemeWorkspaceSettings,
  mergeThemeStylesWithDefaults,
  normalizeThemeWorkspaceSettings,
} from './theme/theme-settings';

export {
  defaultDarkThemeStyles,
  defaultLightThemeStyles,
  defaultThemeStyles,
  DEFAULT_FONT_MONO,
  DEFAULT_FONT_SANS,
  DEFAULT_FONT_SERIF,
} from './theme/theme-defaults';

export { generateThemeCode, type GenerateThemeCodeOptions, type GeneratedThemeCode } from './theme/theme-codegen';

export {
  themeStylePropsSchema,
  themeStylesSchema,
  themeStyleTokenNames,
  type ThemeStyleProps,
  type ThemeStyles,
  type ThemeStyleToken,
} from './theme/theme-schema';
