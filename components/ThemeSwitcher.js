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
};
export function ThemeSwitcher({ currentTheme = 'dark-fantasy', onThemeChange }) {
    const [selectedTheme, setSelectedTheme] = useState(currentTheme);
    const [showMenu, setShowMenu] = useState(false);
    useEffect(() => {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme && storedTheme in themes) {
            setSelectedTheme(storedTheme);
        }
        else {
            setSelectedTheme(currentTheme);
        }
    }, [currentTheme]);
    useEffect(() => {
        document.documentElement.dataset.theme = selectedTheme;
        window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    }, [selectedTheme]);
    const handleThemeChange = (themeId) => {
        setSelectedTheme(themeId);
        onThemeChange?.(themeId);
        setShowMenu(false);
    };
    return (React.createElement("div", { className: "relative" },
        React.createElement("button", { onClick: () => setShowMenu(!showMenu), className: "p-1.5 bg-df-control-bg border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-[var(--color-df-border-hover)] transition-colors", title: "Change Theme" },
            React.createElement(Palette, { size: 14 })),
        showMenu && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "fixed inset-0 z-40", onClick: () => setShowMenu(false) }),
            React.createElement("div", { className: "absolute right-0 top-full mt-2 z-50 bg-df-elevated border border-df-control-border rounded-lg shadow-xl p-1 min-w-[200px]" },
                React.createElement("div", { className: "px-3 py-1 text-[10px] text-df-text-tertiary uppercase border-b border-df-control-border" }, "Theme"),
                Object.entries(themes).map(([id, theme]) => (React.createElement("button", { key: id, onClick: () => handleThemeChange(id), className: `w-full text-left px-3 py-2 text-sm rounded transition-colors ${selectedTheme === id
                        ? 'bg-df-control-active text-df-text-primary'
                        : 'text-df-text-secondary hover:bg-df-control-hover hover:text-df-text-primary'}` },
                    React.createElement("div", { className: "font-medium" }, theme.name),
                    React.createElement("div", { className: "text-[10px] text-df-text-tertiary mt-0.5" }, theme.description)))))))));
}
