'use client';

import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

const THEME_STORAGE_KEY = 'dialogue-forge-theme';

// Theme presets
export const themes = {
  'dark-fantasy': {
    name: 'Dark Fantasy',
    description: 'Modern Spotify-style dark theme',
  },
  light: {
    name: 'Light',
    description: 'Clean, bright theme',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'Neon colors, futuristic vibe',
  },
  darcula: {
    name: 'Darcula',
    description: 'IntelliJ-inspired dark theme',
  },
  'high-contrast': {
    name: 'High Contrast',
    description: 'High contrast for accessibility',
  },
  girly: {
    name: 'Girly',
    description: 'Soft pinks and pastels',
  },
} as const;

export type ThemeId = keyof typeof themes;

interface ThemeSwitcherProps {
  currentTheme?: ThemeId;
  onThemeChange?: (themeId: ThemeId) => void;
}

export function ThemeSwitcher({ currentTheme = 'dark-fantasy', onThemeChange }: ThemeSwitcherProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(currentTheme);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme && storedTheme in themes) {
      setSelectedTheme(storedTheme as ThemeId);
    } else {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = selectedTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  }, [selectedTheme]);

  const handleThemeChange = (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    onThemeChange?.(themeId);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 bg-df-control-bg border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-[var(--color-df-border-hover)] transition-colors"
        title="Change Theme"
      >
        <Palette size={14} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-df-elevated border border-df-control-border rounded-lg shadow-xl p-1 min-w-[200px]">
            <div className="px-3 py-1 text-[10px] text-df-text-tertiary uppercase border-b border-df-control-border">
              Theme
            </div>
            {Object.entries(themes).map(([id, theme]) => (
              <button
                key={id}
                onClick={() => handleThemeChange(id as ThemeId)}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  selectedTheme === id
                    ? 'bg-df-control-active text-df-text-primary'
                    : 'text-df-text-secondary hover:bg-df-control-hover hover:text-df-text-primary'
                }`}
              >
                <div className="font-medium">{theme.name}</div>
                <div className="text-[10px] text-df-text-tertiary mt-0.5">{theme.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
