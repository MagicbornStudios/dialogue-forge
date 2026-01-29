"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.themes = void 0;
exports.ThemeSwitcher = ThemeSwitcher;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const THEME_STORAGE_KEY = 'dialogue-forge-theme';
// Theme presets
exports.themes = {
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
function ThemeSwitcher({ currentTheme = 'dark-fantasy', onThemeChange }) {
    const [selectedTheme, setSelectedTheme] = (0, react_1.useState)(currentTheme);
    const [showMenu, setShowMenu] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme && storedTheme in exports.themes) {
            setSelectedTheme(storedTheme);
        }
        else {
            setSelectedTheme(currentTheme);
        }
    }, [currentTheme]);
    (0, react_1.useEffect)(() => {
        document.documentElement.dataset.theme = selectedTheme;
        window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    }, [selectedTheme]);
    const handleThemeChange = (themeId) => {
        setSelectedTheme(themeId);
        onThemeChange?.(themeId);
        setShowMenu(false);
    };
    return (react_1.default.createElement("div", { className: "relative" },
        react_1.default.createElement("button", { onClick: () => setShowMenu(!showMenu), className: "p-1.5 bg-df-control-bg border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-[var(--color-df-border-hover)] transition-colors", title: "Change Theme" },
            react_1.default.createElement(lucide_react_1.Palette, { size: 14 })),
        showMenu && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "fixed inset-0 z-40", onClick: () => setShowMenu(false) }),
            react_1.default.createElement("div", { className: "absolute right-0 top-full mt-2 z-50 bg-df-elevated border border-df-control-border rounded-lg shadow-xl p-1 min-w-[200px]" },
                react_1.default.createElement("div", { className: "px-3 py-1 text-[10px] text-df-text-tertiary uppercase border-b border-df-control-border" }, "Theme"),
                Object.entries(exports.themes).map(([id, theme]) => (react_1.default.createElement("button", { key: id, onClick: () => handleThemeChange(id), className: `w-full text-left px-3 py-2 text-sm rounded transition-colors ${selectedTheme === id
                        ? 'bg-df-control-active text-df-text-primary'
                        : 'text-df-text-secondary hover:bg-df-control-hover hover:text-df-text-primary'}` },
                    react_1.default.createElement("div", { className: "font-medium" }, theme.name),
                    react_1.default.createElement("div", { className: "text-[10px] text-df-text-tertiary mt-0.5" }, theme.description)))))))));
}
