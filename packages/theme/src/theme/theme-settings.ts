import { defaultThemeStyles } from './theme-defaults';
import { themeStyleTokenNames, type ThemeStyleToken, type ThemeStyles } from './theme-schema';
import type {
  ThemeSource,
  ThemeWorkspaceSettingsV1,
  ThemeWorkspaceTheme,
} from '../workspace/theme-workspace-contracts';

export const THEME_WORKSPACE_SETTINGS_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneStyles(styles: ThemeStyles): ThemeStyles {
  return {
    light: { ...styles.light },
    dark: { ...styles.dark },
  };
}

function normalizeModeStyles(value: unknown, fallback: ThemeStyles['light']): ThemeStyles['light'] {
  const source = isRecord(value) ? value : {};
  const next = { ...fallback } as Record<ThemeStyleToken, string | undefined>;

  for (const token of themeStyleTokenNames) {
    const raw = source[token as string];
    if (typeof raw === 'string') {
      next[token as ThemeStyleToken] = raw;
    }
  }

  return next as ThemeStyles['light'];
}

export function mergeThemeStylesWithDefaults(value: unknown): ThemeStyles {
  const source = isRecord(value) ? value : {};

  return {
    light: normalizeModeStyles(source.light, defaultThemeStyles.light),
    dark: normalizeModeStyles(source.dark, defaultThemeStyles.dark),
  };
}

function normalizeThemeSource(value: unknown): ThemeSource {
  if (value === 'generated' || value === 'manual' || value === 'preset') {
    return value;
  }
  return 'manual';
}

function normalizeTheme(theme: unknown, index: number): ThemeWorkspaceTheme {
  const source = isRecord(theme) ? theme : {};
  const now = new Date().toISOString();
  const id =
    typeof source.id === 'string' && source.id.trim().length > 0
      ? source.id
      : `theme_${index + 1}_${Math.random().toString(36).slice(2, 8)}`;

  const name =
    typeof source.name === 'string' && source.name.trim().length > 0
      ? source.name.trim()
      : `Theme ${index + 1}`;

  return {
    id,
    name,
    styles: mergeThemeStylesWithDefaults(source.styles),
    source: normalizeThemeSource(source.source),
    createdAt:
      typeof source.createdAt === 'string' && source.createdAt.trim().length > 0
        ? source.createdAt
        : now,
    updatedAt:
      typeof source.updatedAt === 'string' && source.updatedAt.trim().length > 0
        ? source.updatedAt
        : now,
  };
}

export function createDefaultTheme(name = 'Default Theme'): ThemeWorkspaceTheme {
  const now = new Date().toISOString();
  return {
    id: `theme_default_${Math.random().toString(36).slice(2, 8)}`,
    name,
    styles: cloneStyles(defaultThemeStyles),
    source: 'preset',
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultThemeWorkspaceSettings(): ThemeWorkspaceSettingsV1 {
  const defaultTheme = createDefaultTheme();

  return {
    version: THEME_WORKSPACE_SETTINGS_VERSION,
    activeThemeId: defaultTheme.id,
    themes: [defaultTheme],
  };
}

export function normalizeThemeWorkspaceSettings(value: unknown): ThemeWorkspaceSettingsV1 {
  const source = isRecord(value) ? value : {};
  const themesRaw = Array.isArray(source.themes) ? source.themes : [];
  const normalizedThemes = themesRaw.map((theme, index) => normalizeTheme(theme, index));

  const themes = normalizedThemes.length > 0 ? normalizedThemes : [createDefaultTheme()];

  const activeThemeIdRaw =
    typeof source.activeThemeId === 'string' && source.activeThemeId.trim().length > 0
      ? source.activeThemeId
      : null;

  const activeThemeExists =
    activeThemeIdRaw != null && themes.some((theme) => theme.id === activeThemeIdRaw);

  return {
    version: THEME_WORKSPACE_SETTINGS_VERSION,
    activeThemeId: activeThemeExists ? activeThemeIdRaw : themes[0]?.id ?? null,
    themes,
  };
}
