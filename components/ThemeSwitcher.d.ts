import React from 'react';
export declare const themes: {
    readonly 'dark-fantasy': {
        readonly name: "Dark Fantasy";
        readonly description: "Modern Spotify-style dark theme";
    };
    readonly light: {
        readonly name: "Light";
        readonly description: "Clean, bright theme";
    };
    readonly cyberpunk: {
        readonly name: "Cyberpunk";
        readonly description: "Neon colors, futuristic vibe";
    };
    readonly darcula: {
        readonly name: "Darcula";
        readonly description: "IntelliJ-inspired dark theme";
    };
    readonly 'high-contrast': {
        readonly name: "High Contrast";
        readonly description: "High contrast for accessibility";
    };
    readonly girly: {
        readonly name: "Girly";
        readonly description: "Soft pinks and pastels";
    };
};
export type ThemeId = keyof typeof themes;
interface ThemeSwitcherProps {
    currentTheme?: ThemeId;
    onThemeChange?: (themeId: ThemeId) => void;
}
export declare function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps): React.JSX.Element;
export {};
