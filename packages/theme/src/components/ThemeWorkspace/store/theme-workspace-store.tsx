'use client';

import * as React from 'react';
import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StoreApi } from 'zustand/vanilla';
import type {
  ThemeMode,
  ThemeToken,
  ThemeWorkspaceSettingsV1,
} from '@magicborn/theme/workspace/theme-workspace-contracts';
import type { ThemeStyles } from '@magicborn/theme/theme/theme-schema';
import {
  createDefaultTheme,
  createDefaultThemeWorkspaceSettings,
  mergeThemeStylesWithDefaults,
  normalizeThemeWorkspaceSettings,
} from '@magicborn/theme/theme/theme-settings';

export type ThemeChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  modelUsed?: string;
};

export type ThemeWorkspacePanel = 'ai' | 'code';
export type ThemeCodePanel = 'css' | 'tailwind';

type ThemeState = {
  settings: ThemeWorkspaceSettingsV1;
  mode: ThemeMode;
  selectedThemeId: string | null;
};

type HistoryState = {
  past: ThemeStyles[];
  future: ThemeStyles[];
};

type AiState = {
  messages: ThemeChatMessage[];
  promptDraft: string;
  isLoading: boolean;
  error: string | null;
};

type ViewState = {
  rightPanel: ThemeWorkspacePanel;
  codePanel: ThemeCodePanel;
};

export interface ThemeWorkspaceState {
  themeState: ThemeState;
  historyState: HistoryState;
  aiState: AiState;
  viewState: ViewState;
  actions: {
    loadSettings: (settings: ThemeWorkspaceSettingsV1) => void;
    setMode: (mode: ThemeMode) => void;
    setSelectedThemeId: (themeId: string | null) => void;
    setActiveThemeId: (themeId: string) => void;
    createTheme: (name?: string) => void;
    deleteTheme: (themeId: string) => void;
    renameTheme: (themeId: string, nextName: string) => void;
    updateActiveThemeToken: (token: ThemeToken, value: string) => void;
    applyGeneratedThemeStyles: (styles: ThemeStyles) => void;
    undo: () => void;
    redo: () => void;
    setPromptDraft: (prompt: string) => void;
    appendMessage: (message: Omit<ThemeChatMessage, 'id' | 'createdAt'>) => void;
    clearMessages: () => void;
    setAiLoading: (loading: boolean) => void;
    setAiError: (error: string | null) => void;
    setRightPanel: (panel: ThemeWorkspacePanel) => void;
    setCodePanel: (panel: ThemeCodePanel) => void;
  };
}

const MAX_HISTORY_ENTRIES = 50;

function findThemeIndex(settings: ThemeWorkspaceSettingsV1, selectedThemeId: string | null): number {
  const index = settings.themes.findIndex((theme) => theme.id === selectedThemeId);
  return index >= 0 ? index : 0;
}

function getActiveTheme(state: ThemeWorkspaceState) {
  const settings = state.themeState.settings;
  if (settings.themes.length === 0) {
    return null;
  }
  const index = findThemeIndex(settings, state.themeState.selectedThemeId);
  return settings.themes[index] ?? null;
}

function pushPastSnapshot(state: ThemeWorkspaceState, snapshot: ThemeStyles) {
  state.historyState.past.push(snapshot);
  if (state.historyState.past.length > MAX_HISTORY_ENTRIES) {
    state.historyState.past.shift();
  }
  state.historyState.future = [];
}

function cloneStyles(styles: ThemeStyles): ThemeStyles {
  return {
    light: { ...styles.light },
    dark: { ...styles.dark },
  };
}

function nowIso() {
  return new Date().toISOString();
}

export function createThemeWorkspaceStore(): StoreApi<ThemeWorkspaceState> {
  const defaultSettings = createDefaultThemeWorkspaceSettings();

  return createStore<ThemeWorkspaceState>()(
    devtools(
      immer<ThemeWorkspaceState>((set, get) => ({
        themeState: {
          settings: defaultSettings,
          mode: 'light',
          selectedThemeId: defaultSettings.activeThemeId,
        },
        historyState: {
          past: [],
          future: [],
        },
        aiState: {
          messages: [],
          promptDraft: '',
          isLoading: false,
          error: null,
        },
        viewState: {
          rightPanel: 'ai',
          codePanel: 'css',
        },
        actions: {
          loadSettings: (settings) => {
            set((state) => {
              const normalized = normalizeThemeWorkspaceSettings(settings);
              state.themeState.settings = normalized;
              state.themeState.selectedThemeId = normalized.activeThemeId;
              state.historyState.past = [];
              state.historyState.future = [];
              state.aiState.error = null;
            });
          },
          setMode: (mode) => {
            set((state) => {
              state.themeState.mode = mode;
            });
          },
          setSelectedThemeId: (themeId) => {
            set((state) => {
              state.themeState.selectedThemeId = themeId;
            });
          },
          setActiveThemeId: (themeId) => {
            set((state) => {
              const exists = state.themeState.settings.themes.some((theme) => theme.id === themeId);
              if (!exists) {
                return;
              }
              state.themeState.settings.activeThemeId = themeId;
              state.themeState.selectedThemeId = themeId;
            });
          },
          createTheme: (name) => {
            set((state) => {
              const current = getActiveTheme(state);
              const baseTheme = current
                ? {
                    ...createDefaultTheme(name ?? `Theme ${state.themeState.settings.themes.length + 1}`),
                    styles: cloneStyles(current.styles),
                    source: 'manual' as const,
                  }
                : createDefaultTheme(name ?? `Theme ${state.themeState.settings.themes.length + 1}`);

              state.themeState.settings.themes.push(baseTheme);
              state.themeState.settings.activeThemeId = baseTheme.id;
              state.themeState.selectedThemeId = baseTheme.id;
              state.historyState.past = [];
              state.historyState.future = [];
            });
          },
          deleteTheme: (themeId) => {
            set((state) => {
              const nextThemes = state.themeState.settings.themes.filter((theme) => theme.id !== themeId);
              if (nextThemes.length === 0) {
                const fallback = createDefaultTheme();
                state.themeState.settings.themes = [fallback];
                state.themeState.settings.activeThemeId = fallback.id;
                state.themeState.selectedThemeId = fallback.id;
              } else {
                state.themeState.settings.themes = nextThemes;
                if (state.themeState.selectedThemeId === themeId || state.themeState.settings.activeThemeId === themeId) {
                  state.themeState.settings.activeThemeId = nextThemes[0]?.id ?? null;
                  state.themeState.selectedThemeId = nextThemes[0]?.id ?? null;
                }
              }
              state.historyState.past = [];
              state.historyState.future = [];
            });
          },
          renameTheme: (themeId, nextName) => {
            set((state) => {
              const name = nextName.trim();
              if (!name) return;

              const theme = state.themeState.settings.themes.find((entry) => entry.id === themeId);
              if (!theme) return;

              theme.name = name;
              theme.updatedAt = nowIso();
            });
          },
          updateActiveThemeToken: (token, value) => {
            set((state) => {
              const activeIndex = findThemeIndex(state.themeState.settings, state.themeState.selectedThemeId);
              const activeTheme = state.themeState.settings.themes[activeIndex];
              if (!activeTheme) return;

              pushPastSnapshot(state, cloneStyles(activeTheme.styles));
              activeTheme.styles[state.themeState.mode][token] = value;
              activeTheme.source = 'manual';
              activeTheme.updatedAt = nowIso();
            });
          },
          applyGeneratedThemeStyles: (styles) => {
            set((state) => {
              const activeIndex = findThemeIndex(state.themeState.settings, state.themeState.selectedThemeId);
              const activeTheme = state.themeState.settings.themes[activeIndex];
              if (!activeTheme) return;

              pushPastSnapshot(state, cloneStyles(activeTheme.styles));
              activeTheme.styles = mergeThemeStylesWithDefaults(styles);
              activeTheme.source = 'generated';
              activeTheme.updatedAt = nowIso();
            });
          },
          undo: () => {
            set((state) => {
              if (state.historyState.past.length === 0) return;

              const activeIndex = findThemeIndex(state.themeState.settings, state.themeState.selectedThemeId);
              const activeTheme = state.themeState.settings.themes[activeIndex];
              if (!activeTheme) return;

              const previous = state.historyState.past.pop();
              if (!previous) return;

              state.historyState.future.unshift(cloneStyles(activeTheme.styles));
              activeTheme.styles = mergeThemeStylesWithDefaults(previous);
              activeTheme.updatedAt = nowIso();
            });
          },
          redo: () => {
            set((state) => {
              if (state.historyState.future.length === 0) return;

              const activeIndex = findThemeIndex(state.themeState.settings, state.themeState.selectedThemeId);
              const activeTheme = state.themeState.settings.themes[activeIndex];
              if (!activeTheme) return;

              const next = state.historyState.future.shift();
              if (!next) return;

              state.historyState.past.push(cloneStyles(activeTheme.styles));
              activeTheme.styles = mergeThemeStylesWithDefaults(next);
              activeTheme.updatedAt = nowIso();
            });
          },
          setPromptDraft: (prompt) => {
            set((state) => {
              state.aiState.promptDraft = prompt;
            });
          },
          appendMessage: (message) => {
            set((state) => {
              state.aiState.messages.push({
                ...message,
                id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                createdAt: nowIso(),
              });
            });
          },
          clearMessages: () => {
            set((state) => {
              state.aiState.messages = [];
              state.aiState.error = null;
            });
          },
          setAiLoading: (loading) => {
            set((state) => {
              state.aiState.isLoading = loading;
            });
          },
          setAiError: (error) => {
            set((state) => {
              state.aiState.error = error;
            });
          },
          setRightPanel: (panel) => {
            set((state) => {
              state.viewState.rightPanel = panel;
            });
          },
          setCodePanel: (panel) => {
            set((state) => {
              state.viewState.codePanel = panel;
            });
          },
        },
      })),
      { name: 'ThemeWorkspaceStore' }
    )
  );
}

const ThemeWorkspaceStoreContext = createContext<StoreApi<ThemeWorkspaceState> | null>(null);

export function ThemeWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: StoreApi<ThemeWorkspaceState> }>) {
  return (
    <ThemeWorkspaceStoreContext.Provider value={store}>
      {children}
    </ThemeWorkspaceStoreContext.Provider>
  );
}

export function useThemeWorkspaceStore<T>(selector: (state: ThemeWorkspaceState) => T): T {
  const store = useContext(ThemeWorkspaceStoreContext);
  if (!store) {
    throw new Error('useThemeWorkspaceStore must be used within ThemeWorkspaceStoreProvider');
  }

  return useStore(store, selector);
}

export function useThemeWorkspaceStoreInstance(): StoreApi<ThemeWorkspaceState> {
  const store = useContext(ThemeWorkspaceStoreContext);
  if (!store) {
    throw new Error('useThemeWorkspaceStoreInstance must be used within ThemeWorkspaceStoreProvider');
  }

  return store;
}
