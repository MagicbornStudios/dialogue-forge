'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@magicborn/shared/ui/button';
import { Input } from '@magicborn/shared/ui/input';
import { Textarea } from '@magicborn/shared/ui/textarea';
import { Badge } from '@magicborn/shared/ui/badge';
import { ProjectSwitcher, type ProjectSummary } from '@magicborn/shared/ui/ProjectSwitcher';
import { useThemeDataContext } from './ThemeDataContext';
import {
  ThemeWorkspaceStoreProvider,
  createThemeWorkspaceStore,
  useThemeWorkspaceStore,
  type ThemeCodePanel,
  type ThemeWorkspacePanel,
} from './store/theme-workspace-store';
import type {
  ThemeAiAdapter,
  ThemeDataAdapter,
  ThemeGenerationHistoryMessage,
  ThemeMode,
  ThemeProjectSummary,
  ThemeToken,
  ThemeWorkspaceTheme,
} from '@magicborn/theme/workspace/theme-workspace-contracts';
import { defaultThemeStyles } from '@magicborn/theme/theme/theme-defaults';
import { generateThemeCode } from '@magicborn/theme/theme/theme-codegen';
import type { ThemeStyles } from '@magicborn/theme/theme/theme-schema';
import { normalizeThemeWorkspaceSettings } from '@magicborn/theme/theme/theme-settings';

const PRIMARY_EDITABLE_TOKENS: ThemeToken[] = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'radius',
  'font-sans',
  'font-serif',
  'font-mono',
  'letter-spacing',
  'spacing',
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ThemeWorkspaceProps {
  className?: string;
  dataAdapter?: ThemeDataAdapter;
  aiAdapter?: ThemeAiAdapter;
  selectedProjectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
  headerLinks?: Array<{ label: string; href: string; target?: string; icon?: React.ReactNode }>;
}

export function ThemeWorkspace({
  className = '',
  dataAdapter,
  aiAdapter,
  selectedProjectId,
  onProjectChange,
  headerLinks,
}: ThemeWorkspaceProps) {
  const contextAdapter = useThemeDataContext();
  const effectiveAdapter = dataAdapter ?? contextAdapter ?? null;
  const storeRef = useRef(createThemeWorkspaceStore());

  return (
    <ThemeWorkspaceStoreProvider store={storeRef.current}>
      <ThemeWorkspaceContent
        className={className}
        dataAdapter={effectiveAdapter}
        aiAdapter={aiAdapter}
        selectedProjectId={selectedProjectId}
        onProjectChange={onProjectChange}
        headerLinks={headerLinks}
      />
    </ThemeWorkspaceStoreProvider>
  );
}

function ThemeWorkspaceContent({
  className,
  dataAdapter,
  aiAdapter,
  selectedProjectId,
  onProjectChange,
  headerLinks,
}: {
  className: string;
  dataAdapter: ThemeDataAdapter | null;
  aiAdapter?: ThemeAiAdapter;
  selectedProjectId?: number | null;
  onProjectChange?: (projectId: number | null) => void;
  headerLinks?: Array<{ label: string; href: string; target?: string; icon?: React.ReactNode }>;
}) {
  const [projects, setProjects] = useState<ThemeProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [internalProjectId, setInternalProjectId] = useState<number | null>(selectedProjectId ?? null);
  const effectiveProjectId = selectedProjectId === undefined ? internalProjectId : selectedProjectId;

  const settings = useThemeWorkspaceStore((state) => state.themeState.settings);
  const selectedThemeId = useThemeWorkspaceStore((state) => state.themeState.selectedThemeId);
  const mode = useThemeWorkspaceStore((state) => state.themeState.mode);
  const historyState = useThemeWorkspaceStore((state) => state.historyState);
  const aiState = useThemeWorkspaceStore((state) => state.aiState);
  const viewState = useThemeWorkspaceStore((state) => state.viewState);
  const actions = useThemeWorkspaceStore((state) => state.actions);

  const persistedSettingsHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedProjectId !== undefined) {
      setInternalProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleProjectChange = useCallback(
    (nextProjectId: number | null) => {
      if (selectedProjectId === undefined) {
        setInternalProjectId(nextProjectId);
      }
      onProjectChange?.(nextProjectId);
    },
    [onProjectChange, selectedProjectId]
  );

  const loadProjects = useCallback(async () => {
    if (!dataAdapter) {
      setProjects([]);
      return;
    }

    setProjectsLoading(true);
    setProjectsError(null);

    try {
      const nextProjects = await dataAdapter.listProjects();
      setProjects(nextProjects);

      if (effectiveProjectId == null && nextProjects.length > 0) {
        handleProjectChange(nextProjects[0]?.id ?? null);
      }
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : 'Failed to load projects.');
    } finally {
      setProjectsLoading(false);
    }
  }, [dataAdapter, effectiveProjectId, handleProjectChange]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!dataAdapter || effectiveProjectId == null) {
      actions.loadSettings(normalizeThemeWorkspaceSettings(undefined));
      persistedSettingsHashRef.current = JSON.stringify(normalizeThemeWorkspaceSettings(undefined));
      return;
    }

    let cancelled = false;
    setSettingsLoading(true);
    setSettingsError(null);

    dataAdapter
      .getThemeWorkspaceSettings(effectiveProjectId)
      .then((nextSettings) => {
        if (cancelled) {
          return;
        }

        const normalized = normalizeThemeWorkspaceSettings(nextSettings);
        actions.loadSettings(normalized);
        persistedSettingsHashRef.current = JSON.stringify(normalized);
      })
      .catch((error) => {
        if (!cancelled) {
          setSettingsError(error instanceof Error ? error.message : 'Failed to load theme settings.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actions, dataAdapter, effectiveProjectId]);

  const settingsHash = useMemo(() => JSON.stringify(settings), [settings]);

  useEffect(() => {
    if (!dataAdapter || effectiveProjectId == null || settingsLoading) {
      return;
    }

    if (persistedSettingsHashRef.current === settingsHash) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSaveStatus('saving');
      setSaveError(null);

      try {
        const saved = await dataAdapter.saveThemeWorkspaceSettings(effectiveProjectId, settings);
        const normalized = normalizeThemeWorkspaceSettings(saved);
        persistedSettingsHashRef.current = JSON.stringify(normalized);
        setSaveStatus('saved');
        window.setTimeout(() => {
          setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
        }, 1200);
      } catch (error) {
        setSaveStatus('error');
        setSaveError(error instanceof Error ? error.message : 'Failed to save theme settings.');
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [dataAdapter, effectiveProjectId, settings, settingsHash, settingsLoading]);

  const activeTheme = useMemo(() => {
    if (settings.themes.length === 0) {
      return null;
    }

    const selected = settings.themes.find((theme) => theme.id === selectedThemeId);
    return selected ?? settings.themes[0] ?? null;
  }, [settings.themes, selectedThemeId]);

  const activeStyles = activeTheme?.styles[mode] ?? defaultThemeStyles[mode];
  const generatedCode = useMemo(() => {
    const generated = generateThemeCode(activeTheme?.styles ?? defaultThemeStyles, {
      tailwindVersion: '4',
    });

    return generated;
  }, [activeTheme]);

  const handleCreateProject = useCallback(
    async (data: { name: string; description?: string }): Promise<ProjectSummary> => {
      if (!dataAdapter) {
        throw new Error('Theme data adapter is not configured.');
      }

      const created = await dataAdapter.createProject({
        name: data.name,
        description: data.description,
      });
      await loadProjects();
      handleProjectChange(created.id);
      return created;
    },
    [dataAdapter, handleProjectChange, loadProjects]
  );

  const handleGenerateTheme = useCallback(async () => {
    const prompt = aiState.promptDraft.trim();
    if (!prompt || !activeTheme) {
      return;
    }

    const history: ThemeGenerationHistoryMessage[] = [
      ...aiState.messages.map((message) => ({ role: message.role, content: message.content })),
      { role: 'user', content: prompt },
    ];

    actions.appendMessage({ role: 'user', content: prompt });
    actions.setPromptDraft('');
    actions.setAiError(null);
    actions.setAiLoading(true);

    try {
      const result = aiAdapter
        ? await aiAdapter.generateTheme({
            prompt,
            currentStyles: activeTheme.styles,
            history,
          })
        : await generateThemeWithApi({
            prompt,
            currentStyles: activeTheme.styles,
            history,
          });

      actions.applyGeneratedThemeStyles(result.themeStyles);
      actions.appendMessage({
        role: 'assistant',
        content: result.assistantText,
        modelUsed: result.modelUsed,
      });
    } catch (error) {
      actions.setAiError(error instanceof Error ? error.message : 'Theme generation failed.');
    } finally {
      actions.setAiLoading(false);
    }
  }, [actions, activeTheme, aiAdapter, aiState.messages, aiState.promptDraft]);

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <ProjectSwitcher
        projects={projects}
        selectedProjectId={effectiveProjectId}
        onProjectChange={(id) => handleProjectChange(typeof id === 'number' ? id : null)}
        onCreateProject={handleCreateProject}
        isLoading={projectsLoading}
        error={projectsError}
        variant="full"
      >
        <div className="ml-auto flex items-center gap-2">
          <ThemeModeSwitcher mode={mode} onModeChange={actions.setMode} />
          <Button variant="outline" size="sm" onClick={actions.undo} disabled={historyState.past.length === 0}>
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={actions.redo} disabled={historyState.future.length === 0}>
            Redo
          </Button>
          <SaveStatusBadge status={saveStatus} error={saveError} />
          {headerLinks?.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.target}
              rel={link.target === '_blank' ? 'noreferrer' : undefined}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </ProjectSwitcher>

      {settingsError ? (
        <div className="mx-4 mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
          {settingsError}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-df-control-border bg-df-surface p-3">
          <ThemeSidebar
            themes={settings.themes}
            activeThemeId={activeTheme?.id ?? null}
            onCreateTheme={() => actions.createTheme()}
            onSelectTheme={actions.setActiveThemeId}
            onDeleteTheme={actions.deleteTheme}
            onRenameTheme={actions.renameTheme}
            loading={settingsLoading}
          />
        </aside>

        <section className="min-h-0 flex-1 overflow-y-auto border-r border-df-control-border p-4">
          <ThemeEditorPanel
            mode={mode}
            activeTheme={activeTheme}
            activeStyles={activeStyles}
            onTokenChange={(token, value) => actions.updateActiveThemeToken(token, value)}
          />
          <ThemePreview mode={mode} styles={activeStyles} />
        </section>

        <aside className="min-h-0 w-[34rem] shrink-0 overflow-hidden bg-df-surface p-4">
          <RightPanelTabs
            panel={viewState.rightPanel}
            codePanel={viewState.codePanel}
            onPanelChange={actions.setRightPanel}
            onCodePanelChange={actions.setCodePanel}
          />

          {viewState.rightPanel === 'ai' ? (
            <ThemeAiPanel
              messages={aiState.messages}
              prompt={aiState.promptDraft}
              isLoading={aiState.isLoading}
              error={aiState.error}
              onPromptChange={actions.setPromptDraft}
              onGenerate={handleGenerateTheme}
              onClearMessages={actions.clearMessages}
            />
          ) : (
            <ThemeCodePanel
              codePanel={viewState.codePanel}
              css={generatedCode.css}
              tailwind={generatedCode.tailwindConfig}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function ThemeSidebar({
  themes,
  activeThemeId,
  onCreateTheme,
  onSelectTheme,
  onDeleteTheme,
  onRenameTheme,
  loading,
}: {
  themes: ThemeWorkspaceTheme[];
  activeThemeId: string | null;
  onCreateTheme: () => void;
  onSelectTheme: (themeId: string) => void;
  onDeleteTheme: (themeId: string) => void;
  onRenameTheme: (themeId: string, nextName: string) => void;
  loading: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-df-text-primary">Themes</h2>
        <Button size="sm" onClick={onCreateTheme}>
          New
        </Button>
      </div>

      {loading ? <p className="text-xs text-df-text-secondary">Loading project themes...</p> : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;

          return (
            <div
              key={theme.id}
              className={`rounded-md border p-2 ${
                isActive ? 'border-df-control-active bg-df-control-bg/60' : 'border-df-control-border'
              }`}
            >
              <button
                type="button"
                className="mb-2 w-full text-left text-sm font-medium text-df-text-primary"
                onClick={() => onSelectTheme(theme.id)}
              >
                {theme.name}
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {theme.source}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const nextName = window.prompt('Theme name', theme.name);
                    if (nextName != null) {
                      onRenameTheme(theme.id, nextName);
                    }
                  }}
                >
                  Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-400"
                  onClick={() => onDeleteTheme(theme.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThemeEditorPanel({
  mode,
  activeTheme,
  activeStyles,
  onTokenChange,
}: {
  mode: ThemeMode;
  activeTheme: ThemeWorkspaceTheme | null;
  activeStyles: ThemeStyles['light'];
  onTokenChange: (token: ThemeToken, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-df-text-primary">
          {activeTheme?.name ?? 'No theme selected'}
        </h2>
        <p className="text-sm text-df-text-secondary">
          Editing {mode} mode theme tokens. Changes persist into the selected project settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {PRIMARY_EDITABLE_TOKENS.map((token) => (
          <label key={token} className="space-y-1">
            <span className="text-xs font-medium text-df-text-secondary">{token}</span>
            <Input
              value={(activeStyles[token] as string | undefined) ?? ''}
              onChange={(event) => onTokenChange(token, event.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function ThemePreview({ mode, styles }: { mode: ThemeMode; styles: ThemeStyles['light'] }) {
  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-sm font-semibold text-df-text-primary">Preview ({mode})</h3>
      <div
        className="rounded-lg border p-4"
        style={{
          background: styles.background,
          color: styles.foreground,
          borderColor: styles.border,
        }}
      >
        <div
          className="mb-3 rounded-md border p-3"
          style={{
            background: styles.card,
            color: styles['card-foreground'],
            borderColor: styles.border,
          }}
        >
          <p className="text-sm font-medium">Theme card</p>
          <p className="text-xs opacity-80">Live token preview from the current workspace settings.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: styles.primary, color: styles['primary-foreground'] }}
          >
            Primary
          </button>
          <button
            type="button"
            className="rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: styles.secondary, color: styles['secondary-foreground'] }}
          >
            Secondary
          </button>
          <button
            type="button"
            className="rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: styles.accent, color: styles['accent-foreground'] }}
          >
            Accent
          </button>
        </div>
      </div>
    </div>
  );
}

function RightPanelTabs({
  panel,
  codePanel,
  onPanelChange,
  onCodePanelChange,
}: {
  panel: ThemeWorkspacePanel;
  codePanel: ThemeCodePanel;
  onPanelChange: (panel: ThemeWorkspacePanel) => void;
  onCodePanelChange: (panel: ThemeCodePanel) => void;
}) {
  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center gap-2">
        <Button variant={panel === 'ai' ? 'default' : 'outline'} size="sm" onClick={() => onPanelChange('ai')}>
          AI
        </Button>
        <Button variant={panel === 'code' ? 'default' : 'outline'} size="sm" onClick={() => onPanelChange('code')}>
          Code
        </Button>
      </div>

      {panel === 'code' ? (
        <div className="flex items-center gap-2">
          <Button
            variant={codePanel === 'css' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCodePanelChange('css')}
          >
            index.css
          </Button>
          <Button
            variant={codePanel === 'tailwind' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCodePanelChange('tailwind')}
          >
            tailwind.config
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ThemeAiPanel({
  messages,
  prompt,
  isLoading,
  error,
  onPromptChange,
  onGenerate,
  onClearMessages,
}: {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; modelUsed?: string }>;
  prompt: string;
  isLoading: boolean;
  error: string | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onClearMessages: () => void;
}) {
  return (
    <div className="flex h-[calc(100%-56px)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-df-text-primary">Theme assistant</h3>
        <Button variant="outline" size="sm" onClick={onClearMessages} disabled={messages.length === 0}>
          Clear
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-md border border-df-control-border bg-df-control-bg/40 p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-df-text-secondary">
            Ask for a theme and the assistant will generate a full token set using OpenRouter free model routing.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="rounded border border-df-control-border bg-df-surface p-2">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase text-df-text-secondary">
                <span>{message.role}</span>
                {message.modelUsed ? <Badge variant="outline">{message.modelUsed}</Badge> : null}
              </div>
              <p className="whitespace-pre-wrap text-xs text-df-text-primary">{message.content}</p>
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      <div className="space-y-2">
        <Textarea
          rows={4}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Generate a cinematic dark writing theme with soft blue accents and high contrast typography."
        />
        <Button onClick={onGenerate} disabled={isLoading || prompt.trim().length === 0}>
          {isLoading ? 'Generating...' : 'Generate Theme'}
        </Button>
      </div>
    </div>
  );
}

function ThemeCodePanel({
  codePanel,
  css,
  tailwind,
}: {
  codePanel: ThemeCodePanel;
  css: string;
  tailwind: string;
}) {
  const content = codePanel === 'css' ? css : tailwind;

  return (
    <div className="h-[calc(100%-56px)] overflow-auto rounded-md border border-df-control-border bg-df-control-bg/40 p-3">
      <pre className="whitespace-pre-wrap text-xs text-df-text-primary">{content}</pre>
    </div>
  );
}

function ThemeModeSwitcher({
  mode,
  onModeChange,
}: {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background p-1">
      <Button
        size="sm"
        variant={mode === 'light' ? 'default' : 'ghost'}
        className="h-7 px-2 text-xs"
        onClick={() => onModeChange('light')}
      >
        Light
      </Button>
      <Button
        size="sm"
        variant={mode === 'dark' ? 'default' : 'ghost'}
        className="h-7 px-2 text-xs"
        onClick={() => onModeChange('dark')}
      >
        Dark
      </Button>
    </div>
  );
}

function SaveStatusBadge({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === 'saving') {
    return <Badge variant="outline">Saving...</Badge>;
  }

  if (status === 'saved') {
    return <Badge variant="outline">Saved</Badge>;
  }

  if (status === 'error') {
    return <Badge variant="destructive">Save failed{error ? ': ' + error : ''}</Badge>;
  }

  return null;
}

async function generateThemeWithApi(input: {
  prompt: string;
  currentStyles: ThemeStyles;
  history: ThemeGenerationHistoryMessage[];
}) {
  const response = await fetch('/api/theme/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    assistantText?: string;
    themeStyles?: ThemeStyles;
    modelUsed?: string;
    error?: string;
    code?: string;
    details?: string;
    chain?: string[];
  };

  if (!response.ok) {
    const parts = [
      payload.error,
      payload.details,
      Array.isArray(payload.chain) && payload.chain.length > 0
        ? `chain: ${payload.chain.join(' -> ')}`
        : null,
      payload.code,
    ].filter((value): value is string => Boolean(value && value.trim().length > 0));

    throw new Error(parts.join(' | ') || 'Theme generation request failed.');
  }

  if (!payload.assistantText || !payload.themeStyles || !payload.modelUsed) {
    throw new Error('Theme generation response was invalid.');
  }

  return {
    assistantText: payload.assistantText,
    themeStyles: payload.themeStyles,
    modelUsed: payload.modelUsed,
  };
}
