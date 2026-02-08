import { defaultThemeStyles } from './theme-defaults';
import type { ThemeStyles } from './theme-schema';

export type GenerateThemeCodeOptions = {
  tailwindVersion?: '3' | '4';
};

export type GeneratedThemeCode = {
  css: string;
  tailwindConfig: string;
};

const COLOR_VARIABLE_KEYS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
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
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

function generateModeCss(styles: ThemeStyles['light'], selector: ':root' | '.dark'): string {
  const colorLines = COLOR_VARIABLE_KEYS.map((token) => `  --${token}: ${styles[token]};`);

  return [
    `${selector} {`,
    ...colorLines,
    `  --font-sans: ${styles['font-sans']};`,
    `  --font-serif: ${styles['font-serif']};`,
    `  --font-mono: ${styles['font-mono']};`,
    `  --radius: ${styles.radius};`,
    `  --shadow-color: ${styles['shadow-color']};`,
    `  --shadow-opacity: ${styles['shadow-opacity']};`,
    `  --shadow-blur: ${styles['shadow-blur']};`,
    `  --shadow-spread: ${styles['shadow-spread']};`,
    `  --shadow-offset-x: ${styles['shadow-offset-x']};`,
    `  --shadow-offset-y: ${styles['shadow-offset-y']};`,
    `  --tracking-normal: ${styles['letter-spacing']};`,
    `  --spacing: ${styles.spacing ?? defaultThemeStyles.light.spacing ?? '0.25rem'};`,
    '}',
  ].join('\n');
}

function generateTailwindV4InlineThemeBlock(): string {
  return [
    '@theme inline {',
    '  --color-background: var(--background);',
    '  --color-foreground: var(--foreground);',
    '  --color-card: var(--card);',
    '  --color-card-foreground: var(--card-foreground);',
    '  --color-popover: var(--popover);',
    '  --color-popover-foreground: var(--popover-foreground);',
    '  --color-primary: var(--primary);',
    '  --color-primary-foreground: var(--primary-foreground);',
    '  --color-secondary: var(--secondary);',
    '  --color-secondary-foreground: var(--secondary-foreground);',
    '  --color-muted: var(--muted);',
    '  --color-muted-foreground: var(--muted-foreground);',
    '  --color-accent: var(--accent);',
    '  --color-accent-foreground: var(--accent-foreground);',
    '  --color-destructive: var(--destructive);',
    '  --color-destructive-foreground: var(--destructive-foreground);',
    '  --color-border: var(--border);',
    '  --color-input: var(--input);',
    '  --color-ring: var(--ring);',
    '  --color-chart-1: var(--chart-1);',
    '  --color-chart-2: var(--chart-2);',
    '  --color-chart-3: var(--chart-3);',
    '  --color-chart-4: var(--chart-4);',
    '  --color-chart-5: var(--chart-5);',
    '  --color-sidebar: var(--sidebar);',
    '  --color-sidebar-foreground: var(--sidebar-foreground);',
    '  --color-sidebar-primary: var(--sidebar-primary);',
    '  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);',
    '  --color-sidebar-accent: var(--sidebar-accent);',
    '  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);',
    '  --color-sidebar-border: var(--sidebar-border);',
    '  --color-sidebar-ring: var(--sidebar-ring);',
    '  --font-sans: var(--font-sans);',
    '  --font-serif: var(--font-serif);',
    '  --font-mono: var(--font-mono);',
    '  --radius-sm: calc(var(--radius) - 4px);',
    '  --radius-md: calc(var(--radius) - 2px);',
    '  --radius-lg: var(--radius);',
    '  --radius-xl: calc(var(--radius) + 4px);',
    '}',
  ].join('\n');
}

function generateTailwindV3Config(): string {
  return [
    '/** @type {import(\'tailwindcss\').Config} */',
    'module.exports = {',
    '  darkMode: [\'class\'],',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    '        background: \"hsl(var(--background))\",',
    '        foreground: \"hsl(var(--foreground))\",',
    '        border: \"hsl(var(--border))\",',
    '        input: \"hsl(var(--input))\",',
    '        ring: \"hsl(var(--ring))\",',
    '        primary: { DEFAULT: \"hsl(var(--primary))\", foreground: \"hsl(var(--primary-foreground))\" },',
    '        secondary: { DEFAULT: \"hsl(var(--secondary))\", foreground: \"hsl(var(--secondary-foreground))\" },',
    '        muted: { DEFAULT: \"hsl(var(--muted))\", foreground: \"hsl(var(--muted-foreground))\" },',
    '        accent: { DEFAULT: \"hsl(var(--accent))\", foreground: \"hsl(var(--accent-foreground))\" },',
    '      },',
    '      borderRadius: {',
    '        sm: \"calc(var(--radius) - 4px)\",',
    '        md: \"calc(var(--radius) - 2px)\",',
    '        lg: \"var(--radius)\",',
    '        xl: \"calc(var(--radius) + 4px)\",',
    '      },',
    '      fontFamily: {',
    '        sans: [\"var(--font-sans)\"],',
    '        serif: [\"var(--font-serif)\"],',
    '        mono: [\"var(--font-mono)\"],',
    '      },',
    '    },',
    '  },',
    '};',
  ].join('\n');
}

export function generateThemeCode(
  styles: ThemeStyles,
  options: GenerateThemeCodeOptions = {}
): GeneratedThemeCode {
  const tailwindVersion = options.tailwindVersion ?? '4';

  const cssBlocks = [
    generateModeCss(styles.light, ':root'),
    '',
    generateModeCss(styles.dark, '.dark'),
  ];

  if (tailwindVersion === '4') {
    cssBlocks.push('', generateTailwindV4InlineThemeBlock());
  }

  return {
    css: cssBlocks.join('\n').trim(),
    tailwindConfig: generateTailwindV3Config(),
  };
}
