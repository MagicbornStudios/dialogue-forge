'use client';

import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

// Theme presets
export const themes = {
  'dark-fantasy': {
    name: 'Dark Fantasy',
    description: 'Earthy tones, dark fantasy aesthetic',
    css: `
      :root {
        /* Base Colors */
        --color-df-base: oklch(0.15 0.02 250);
        --color-df-surface: oklch(0.18 0.02 260);
        --color-df-elevated: oklch(0.22 0.02 270);
        
        /* NPC Node Colors (duller borders, bright when selected) */
        --color-df-npc-bg: oklch(0.25 0.04 45);
        --color-df-npc-border: oklch(0.35 0.05 35);
        --color-df-npc-header: oklch(0.30 0.10 25);
        --color-df-npc-selected: oklch(0.60 0.20 15);
        
        /* Player Node Colors (duller borders, bright when selected) */
        --color-df-player-bg: oklch(0.22 0.08 300);
        --color-df-player-border: oklch(0.38 0.10 310);
        --color-df-player-header: oklch(0.28 0.12 290);
        --color-df-player-selected: oklch(0.65 0.25 280);
        
        /* Conditional Node (duller borders, bright when selected) */
        --color-df-conditional-bg: oklch(0.24 0.06 150);
        --color-df-conditional-border: oklch(0.35 0.08 140);
        --color-df-conditional-header: oklch(0.30 0.10 145);
        
        /* Start/End */
        --color-df-start: oklch(0.55 0.15 140);
        --color-df-start-bg: oklch(0.25 0.08 140);
        --color-df-end: oklch(0.50 0.15 45);
        --color-df-end-bg: oklch(0.25 0.08 45);
        
        /* Edges (duller default, bright on hover/selection) */
        --color-df-edge-default: oklch(0.35 0.02 250);
        --color-df-edge-default-hover: oklch(0.55 0.10 250);
        --color-df-edge-choice-1: oklch(0.45 0.12 15);
        --color-df-edge-choice-2: oklch(0.50 0.15 280);
        --color-df-edge-choice-3: oklch(0.48 0.12 200);
        --color-df-edge-choice-4: oklch(0.52 0.12 120);
        --color-df-edge-choice-5: oklch(0.45 0.10 45);
        --color-df-edge-loop: oklch(0.50 0.12 60);
        --color-df-edge-dimmed: oklch(0.25 0.02 250);
        
        /* Status */
        --color-df-error: oklch(0.55 0.22 25);
        --color-df-warning: oklch(0.65 0.18 70);
        --color-df-success: oklch(0.60 0.18 150);
        --color-df-info: oklch(0.55 0.15 220);
        
        /* Text */
        --color-df-text-primary: oklch(0.85 0.02 250);
        --color-df-text-secondary: oklch(0.65 0.02 250);
        --color-df-text-tertiary: oklch(0.45 0.02 250);
        
        /* UI Controls */
        --color-df-control-bg: oklch(0.18 0.02 260);
        --color-df-control-border: oklch(0.30 0.03 250);
        --color-df-control-hover: oklch(0.25 0.03 250);
        
        /* Flags */
        --color-df-flag-dialogue: oklch(0.45 0.03 250);
        --color-df-flag-dialogue-bg: oklch(0.20 0.02 250);
        --color-df-flag-quest: oklch(0.50 0.15 220);
        --color-df-flag-quest-bg: oklch(0.22 0.08 220);
        --color-df-flag-achievement: oklch(0.60 0.18 70);
        --color-df-flag-achievement-bg: oklch(0.25 0.10 70);
        --color-df-flag-item: oklch(0.55 0.15 150);
        --color-df-flag-item-bg: oklch(0.25 0.08 150);
        --color-df-flag-stat: oklch(0.55 0.18 280);
        --color-df-flag-stat-bg: oklch(0.25 0.10 280);
        --color-df-flag-title: oklch(0.55 0.18 330);
        --color-df-flag-title-bg: oklch(0.25 0.10 330);
        --color-df-flag-global: oklch(0.50 0.15 45);
        --color-df-flag-global-bg: oklch(0.25 0.08 45);
        
        /* Canvas */
        --color-df-canvas-bg: oklch(0.12 0.01 250);
        --color-df-canvas-grid: oklch(0.20 0.02 250);
        
        /* Sidebar */
        --color-df-sidebar-bg: oklch(0.18 0.02 260);
        --color-df-sidebar-border: oklch(0.35 0.05 250);
        --color-df-editor-bg: oklch(0.15 0.02 240);
        --color-df-editor-border: oklch(0.30 0.03 250);
      }
    `,
  },
  'light': {
    name: 'Light',
    description: 'Clean, bright theme',
    css: `
      :root {
        /* Base Colors */
        --color-df-base: oklch(0.98 0.01 250);
        --color-df-surface: oklch(0.95 0.01 260);
        --color-df-elevated: oklch(0.92 0.01 270);
        
        /* NPC Node Colors */
        --color-df-npc-bg: oklch(0.90 0.03 45);
        --color-df-npc-border: oklch(0.60 0.08 35);
        --color-df-npc-header: oklch(0.85 0.05 25);
        --color-df-npc-selected: oklch(0.55 0.15 15);
        
        /* Player Node Colors */
        --color-df-player-bg: oklch(0.92 0.05 300);
        --color-df-player-border: oklch(0.55 0.15 310);
        --color-df-player-header: oklch(0.88 0.08 290);
        --color-df-player-selected: oklch(0.45 0.20 280);
        
        /* Conditional Node */
        --color-df-conditional-bg: oklch(0.91 0.04 150);
        --color-df-conditional-border: oklch(0.58 0.12 140);
        --color-df-conditional-header: oklch(0.88 0.06 145);
        
        /* Start/End */
        --color-df-start: oklch(0.45 0.15 140);
        --color-df-start-bg: oklch(0.90 0.05 140);
        --color-df-end: oklch(0.50 0.15 45);
        --color-df-end-bg: oklch(0.90 0.05 45);
        
        /* Edges */
        --color-df-edge-default: oklch(0.60 0.03 250);
        --color-df-edge-default-hover: oklch(0.50 0.05 250);
        --color-df-edge-choice-1: oklch(0.50 0.18 15);
        --color-df-edge-choice-2: oklch(0.45 0.20 280);
        --color-df-edge-choice-3: oklch(0.48 0.18 200);
        --color-df-edge-choice-4: oklch(0.42 0.16 120);
        --color-df-edge-choice-5: oklch(0.50 0.15 45);
        --color-df-edge-loop: oklch(0.45 0.15 60);
        --color-df-edge-dimmed: oklch(0.75 0.02 250);
        
        /* Status */
        --color-df-error: oklch(0.45 0.22 25);
        --color-df-warning: oklch(0.35 0.18 70);
        --color-df-success: oklch(0.40 0.18 150);
        --color-df-info: oklch(0.45 0.15 220);
        
        /* Text */
        --color-df-text-primary: oklch(0.15 0.02 250);
        --color-df-text-secondary: oklch(0.35 0.02 250);
        --color-df-text-tertiary: oklch(0.55 0.02 250);
        
        /* UI Controls */
        --color-df-control-bg: oklch(0.95 0.01 260);
        --color-df-control-border: oklch(0.70 0.03 250);
        --color-df-control-hover: oklch(0.88 0.02 250);
        
        /* Flags - same as dark */
        --color-df-flag-dialogue: oklch(0.55 0.03 250);
        --color-df-flag-dialogue-bg: oklch(0.90 0.01 250);
        --color-df-flag-quest: oklch(0.50 0.15 220);
        --color-df-flag-quest-bg: oklch(0.88 0.05 220);
        --color-df-flag-achievement: oklch(0.40 0.18 70);
        --color-df-flag-achievement-bg: oklch(0.90 0.08 70);
        --color-df-flag-item: oklch(0.45 0.15 150);
        --color-df-flag-item-bg: oklch(0.90 0.05 150);
        --color-df-flag-stat: oklch(0.45 0.18 280);
        --color-df-flag-stat-bg: oklch(0.90 0.08 280);
        --color-df-flag-title: oklch(0.45 0.18 330);
        --color-df-flag-title-bg: oklch(0.90 0.08 330);
        --color-df-flag-global: oklch(0.50 0.15 45);
        --color-df-flag-global-bg: oklch(0.90 0.05 45);
        
        /* Canvas */
        --color-df-canvas-bg: oklch(0.98 0.01 250);
        --color-df-canvas-grid: oklch(0.85 0.01 250);
        
        /* Sidebar */
        --color-df-sidebar-bg: oklch(0.95 0.01 260);
        --color-df-sidebar-border: oklch(0.65 0.05 250);
        --color-df-editor-bg: oklch(0.98 0.01 240);
        --color-df-editor-border: oklch(0.70 0.03 250);
      }
    `,
  },
  'cyberpunk': {
    name: 'Cyberpunk',
    description: 'Neon colors, futuristic vibe',
    css: `
      :root {
        /* Base Colors */
        --color-df-base: oklch(0.10 0.02 280);
        --color-df-surface: oklch(0.12 0.03 280);
        --color-df-elevated: oklch(0.15 0.04 280);
        
        /* NPC Node Colors */
        --color-df-npc-bg: oklch(0.15 0.08 200);
        --color-df-npc-border: oklch(0.50 0.20 200);
        --color-df-npc-header: oklch(0.18 0.10 200);
        --color-df-npc-selected: oklch(0.60 0.25 200);
        
        /* Player Node Colors */
        --color-df-player-bg: oklch(0.15 0.08 320);
        --color-df-player-border: oklch(0.55 0.25 320);
        --color-df-player-header: oklch(0.18 0.12 320);
        --color-df-player-selected: oklch(0.65 0.30 320);
        
        /* Conditional Node */
        --color-df-conditional-bg: oklch(0.15 0.08 150);
        --color-df-conditional-border: oklch(0.55 0.20 150);
        --color-df-conditional-header: oklch(0.18 0.10 150);
        
        /* Start/End */
        --color-df-start: oklch(0.60 0.25 150);
        --color-df-start-bg: oklch(0.20 0.10 150);
        --color-df-end: oklch(0.55 0.25 30);
        --color-df-end-bg: oklch(0.20 0.10 30);
        
        /* Edges */
        --color-df-edge-default: oklch(0.45 0.15 280);
        --color-df-edge-default-hover: oklch(0.55 0.20 280);
        --color-df-edge-choice-1: oklch(0.60 0.25 0);
        --color-df-edge-choice-2: oklch(0.65 0.30 320);
        --color-df-edge-choice-3: oklch(0.60 0.25 200);
        --color-df-edge-choice-4: oklch(0.65 0.25 150);
        --color-df-edge-choice-5: oklch(0.60 0.25 60);
        --color-df-edge-loop: oklch(0.65 0.25 30);
        --color-df-edge-dimmed: oklch(0.25 0.05 280);
        
        /* Status */
        --color-df-error: oklch(0.60 0.25 25);
        --color-df-warning: oklch(0.65 0.25 70);
        --color-df-success: oklch(0.60 0.25 150);
        --color-df-info: oklch(0.60 0.25 220);
        
        /* Text */
        --color-df-text-primary: oklch(0.90 0.02 280);
        --color-df-text-secondary: oklch(0.70 0.03 280);
        --color-df-text-tertiary: oklch(0.50 0.03 280);
        
        /* UI Controls */
        --color-df-control-bg: oklch(0.12 0.03 280);
        --color-df-control-border: oklch(0.40 0.10 280);
        --color-df-control-hover: oklch(0.18 0.05 280);
        
        /* Flags */
        --color-df-flag-dialogue: oklch(0.50 0.15 280);
        --color-df-flag-dialogue-bg: oklch(0.15 0.05 280);
        --color-df-flag-quest: oklch(0.60 0.25 220);
        --color-df-flag-quest-bg: oklch(0.18 0.08 220);
        --color-df-flag-achievement: oklch(0.65 0.25 70);
        --color-df-flag-achievement-bg: oklch(0.20 0.10 70);
        --color-df-flag-item: oklch(0.60 0.25 150);
        --color-df-flag-item-bg: oklch(0.18 0.08 150);
        --color-df-flag-stat: oklch(0.65 0.30 320);
        --color-df-flag-stat-bg: oklch(0.18 0.12 320);
        --color-df-flag-title: oklch(0.65 0.30 330);
        --color-df-flag-title-bg: oklch(0.18 0.12 330);
        --color-df-flag-global: oklch(0.60 0.25 30);
        --color-df-flag-global-bg: oklch(0.18 0.10 30);
        
        /* Canvas */
        --color-df-canvas-bg: oklch(0.08 0.01 280);
        --color-df-canvas-grid: oklch(0.15 0.03 280);
        
        /* Sidebar */
        --color-df-sidebar-bg: oklch(0.12 0.03 280);
        --color-df-sidebar-border: oklch(0.40 0.10 280);
        --color-df-editor-bg: oklch(0.10 0.02 280);
        --color-df-editor-border: oklch(0.35 0.08 280);
      }
    `,
  },
  'darcula': {
    name: 'Darcula',
    description: 'IntelliJ-inspired dark theme',
    css: `
      :root {
        /* Base Colors */
        --color-df-base: oklch(0.20 0.01 250);
        --color-df-surface: oklch(0.22 0.01 260);
        --color-df-elevated: oklch(0.25 0.01 270);
        
        /* NPC Node Colors - Muted Red */
        --color-df-npc-bg: oklch(0.22 0.03 20);
        --color-df-npc-border: oklch(0.35 0.05 20);
        --color-df-npc-header: oklch(0.25 0.04 20);
        --color-df-npc-selected: oklch(0.60 0.15 20);
        
        /* Player Node Colors - Muted Blue */
        --color-df-player-bg: oklch(0.22 0.03 240);
        --color-df-player-border: oklch(0.35 0.05 240);
        --color-df-player-header: oklch(0.25 0.04 240);
        --color-df-player-selected: oklch(0.60 0.15 240);
        
        /* Conditional Node - Muted Green */
        --color-df-conditional-bg: oklch(0.22 0.03 150);
        --color-df-conditional-border: oklch(0.35 0.05 150);
        --color-df-conditional-header: oklch(0.25 0.04 150);
        
        /* Start/End */
        --color-df-start: oklch(0.55 0.12 150);
        --color-df-start-bg: oklch(0.25 0.04 150);
        --color-df-end: oklch(0.50 0.12 30);
        --color-df-end-bg: oklch(0.25 0.04 30);
        
        /* Edges - Duller borders */
        --color-df-edge-default: oklch(0.35 0.02 250);
        --color-df-edge-default-hover: oklch(0.50 0.05 250);
        --color-df-edge-choice-1: oklch(0.50 0.12 20);
        --color-df-edge-choice-2: oklch(0.50 0.12 240);
        --color-df-edge-choice-3: oklch(0.50 0.12 150);
        --color-df-edge-choice-4: oklch(0.50 0.12 60);
        --color-df-edge-choice-5: oklch(0.50 0.12 300);
        --color-df-edge-loop: oklch(0.50 0.12 30);
        --color-df-edge-dimmed: oklch(0.25 0.01 250);
        
        /* Status */
        --color-df-error: oklch(0.55 0.18 25);
        --color-df-warning: oklch(0.60 0.15 70);
        --color-df-success: oklch(0.55 0.12 150);
        --color-df-info: oklch(0.55 0.12 220);
        
        /* Text */
        --color-df-text-primary: oklch(0.85 0.01 250);
        --color-df-text-secondary: oklch(0.60 0.01 250);
        --color-df-text-tertiary: oklch(0.45 0.01 250);
        
        /* UI Controls */
        --color-df-control-bg: oklch(0.22 0.01 260);
        --color-df-control-border: oklch(0.30 0.02 250);
        --color-df-control-hover: oklch(0.28 0.02 250);
        
        /* Flags */
        --color-df-flag-dialogue: oklch(0.50 0.02 250);
        --color-df-flag-dialogue-bg: oklch(0.22 0.01 250);
        --color-df-flag-quest: oklch(0.55 0.12 220);
        --color-df-flag-quest-bg: oklch(0.24 0.04 220);
        --color-df-flag-achievement: oklch(0.60 0.15 70);
        --color-df-flag-achievement-bg: oklch(0.25 0.05 70);
        --color-df-flag-item: oklch(0.55 0.12 150);
        --color-df-flag-item-bg: oklch(0.24 0.04 150);
        --color-df-flag-stat: oklch(0.55 0.12 280);
        --color-df-flag-stat-bg: oklch(0.24 0.04 280);
        --color-df-flag-title: oklch(0.55 0.12 330);
        --color-df-flag-title-bg: oklch(0.24 0.04 330);
        --color-df-flag-global: oklch(0.50 0.12 30);
        --color-df-flag-global-bg: oklch(0.24 0.04 30);
        
        /* Canvas */
        --color-df-canvas-bg: oklch(0.18 0.01 250);
        --color-df-canvas-grid: oklch(0.22 0.01 250);
        
        /* Sidebar */
        --color-df-sidebar-bg: oklch(0.22 0.01 260);
        --color-df-sidebar-border: oklch(0.30 0.02 250);
        --color-df-editor-bg: oklch(0.20 0.01 240);
        --color-df-editor-border: oklch(0.30 0.02 250);
      }
    `,
  },
  'high-contrast': {
    name: 'High Contrast',
    description: 'High contrast for accessibility',
    css: `
      :root {
        /* Base Colors */
        --color-df-base: oklch(0.10 0.01 250);
        --color-df-surface: oklch(0.12 0.01 260);
        --color-df-elevated: oklch(0.15 0.01 270);
        
        /* NPC Node Colors - Bright Red */
        --color-df-npc-bg: oklch(0.15 0.05 20);
        --color-df-npc-border: oklch(0.50 0.20 20);
        --color-df-npc-header: oklch(0.20 0.08 20);
        --color-df-npc-selected: oklch(0.70 0.25 20);
        
        /* Player Node Colors - Bright Blue */
        --color-df-player-bg: oklch(0.15 0.05 240);
        --color-df-player-border: oklch(0.50 0.20 240);
        --color-df-player-header: oklch(0.20 0.08 240);
        --color-df-player-selected: oklch(0.70 0.25 240);
        
        /* Conditional Node - Bright Green */
        --color-df-conditional-bg: oklch(0.15 0.05 150);
        --color-df-conditional-border: oklch(0.50 0.20 150);
        --color-df-conditional-header: oklch(0.20 0.08 150);
        
        /* Start/End */
        --color-df-start: oklch(0.70 0.20 150);
        --color-df-start-bg: oklch(0.20 0.08 150);
        --color-df-end: oklch(0.70 0.20 30);
        --color-df-end-bg: oklch(0.20 0.08 30);
        
        /* Edges - High contrast */
        --color-df-edge-default: oklch(0.60 0.05 250);
        --color-df-edge-default-hover: oklch(0.75 0.10 250);
        --color-df-edge-choice-1: oklch(0.70 0.25 20);
        --color-df-edge-choice-2: oklch(0.70 0.25 240);
        --color-df-edge-choice-3: oklch(0.70 0.25 150);
        --color-df-edge-choice-4: oklch(0.70 0.25 60);
        --color-df-edge-choice-5: oklch(0.70 0.25 300);
        --color-df-edge-loop: oklch(0.70 0.25 30);
        --color-df-edge-dimmed: oklch(0.40 0.02 250);
        
        /* Status */
        --color-df-error: oklch(0.70 0.25 25);
        --color-df-warning: oklch(0.75 0.20 70);
        --color-df-success: oklch(0.70 0.25 150);
        --color-df-info: oklch(0.70 0.25 220);
        
        /* Text */
        --color-df-text-primary: oklch(0.95 0.01 250);
        --color-df-text-secondary: oklch(0.80 0.01 250);
        --color-df-text-tertiary: oklch(0.65 0.01 250);
        
        /* UI Controls */
        --color-df-control-bg: oklch(0.12 0.01 260);
        --color-df-control-border: oklch(0.50 0.05 250);
        --color-df-control-hover: oklch(0.18 0.02 250);
        
        /* Flags */
        --color-df-flag-dialogue: oklch(0.60 0.05 250);
        --color-df-flag-dialogue-bg: oklch(0.15 0.02 250);
        --color-df-flag-quest: oklch(0.70 0.25 220);
        --color-df-flag-quest-bg: oklch(0.20 0.08 220);
        --color-df-flag-achievement: oklch(0.75 0.20 70);
        --color-df-flag-achievement-bg: oklch(0.20 0.10 70);
        --color-df-flag-item: oklch(0.70 0.25 150);
        --color-df-flag-item-bg: oklch(0.20 0.08 150);
        --color-df-flag-stat: oklch(0.70 0.25 280);
        --color-df-flag-stat-bg: oklch(0.20 0.10 280);
        --color-df-flag-title: oklch(0.70 0.25 330);
        --color-df-flag-title-bg: oklch(0.20 0.10 330);
        --color-df-flag-global: oklch(0.70 0.25 30);
        --color-df-flag-global-bg: oklch(0.20 0.08 30);
        
        /* Canvas */
        --color-df-canvas-bg: oklch(0.08 0.01 250);
        --color-df-canvas-grid: oklch(0.25 0.01 250);
        
        /* Sidebar */
        --color-df-sidebar-bg: oklch(0.12 0.01 260);
        --color-df-sidebar-border: oklch(0.50 0.05 250);
        --color-df-editor-bg: oklch(0.10 0.01 240);
        --color-df-editor-border: oklch(0.50 0.05 250);
      }
    `,
  },
  'girly': {
    name: 'Girly',
    description: 'Soft pinks and pastels',
    css: `
      :root {
        /* Base Colors */
        --color-df-base: oklch(0.18 0.02 330);
        --color-df-surface: oklch(0.20 0.02 340);
        --color-df-elevated: oklch(0.23 0.02 350);
        
        /* NPC Node Colors - Soft Pink */
        --color-df-npc-bg: oklch(0.25 0.05 350);
        --color-df-npc-border: oklch(0.45 0.12 350);
        --color-df-npc-header: oklch(0.28 0.08 350);
        --color-df-npc-selected: oklch(0.65 0.20 350);
        
        /* Player Node Colors - Soft Purple */
        --color-df-player-bg: oklch(0.25 0.05 300);
        --color-df-player-border: oklch(0.45 0.12 300);
        --color-df-player-header: oklch(0.28 0.08 300);
        --color-df-player-selected: oklch(0.65 0.20 300);
        
        /* Conditional Node - Soft Mint */
        --color-df-conditional-bg: oklch(0.25 0.05 180);
        --color-df-conditional-border: oklch(0.45 0.12 180);
        --color-df-conditional-header: oklch(0.28 0.08 180);
        
        /* Start/End */
        --color-df-start: oklch(0.65 0.18 180);
        --color-df-start-bg: oklch(0.28 0.08 180);
        --color-df-end: oklch(0.60 0.18 20);
        --color-df-end-bg: oklch(0.28 0.08 20);
        
        /* Edges - Soft pastels */
        --color-df-edge-default: oklch(0.45 0.05 330);
        --color-df-edge-default-hover: oklch(0.55 0.10 330);
        --color-df-edge-choice-1: oklch(0.60 0.18 350);
        --color-df-edge-choice-2: oklch(0.60 0.18 300);
        --color-df-edge-choice-3: oklch(0.60 0.18 180);
        --color-df-edge-choice-4: oklch(0.60 0.18 60);
        --color-df-edge-choice-5: oklch(0.60 0.18 20);
        --color-df-edge-loop: oklch(0.60 0.18 30);
        --color-df-edge-dimmed: oklch(0.30 0.02 330);
        
        /* Status */
        --color-df-error: oklch(0.60 0.20 20);
        --color-df-warning: oklch(0.70 0.18 70);
        --color-df-success: oklch(0.60 0.18 150);
        --color-df-info: oklch(0.60 0.18 220);
        
        /* Text */
        --color-df-text-primary: oklch(0.85 0.02 330);
        --color-df-text-secondary: oklch(0.65 0.02 330);
        --color-df-text-tertiary: oklch(0.50 0.02 330);
        
        /* UI Controls */
        --color-df-control-bg: oklch(0.20 0.02 340);
        --color-df-control-border: oklch(0.40 0.05 330);
        --color-df-control-hover: oklch(0.25 0.03 330);
        
        /* Flags */
        --color-df-flag-dialogue: oklch(0.50 0.05 330);
        --color-df-flag-dialogue-bg: oklch(0.22 0.02 330);
        --color-df-flag-quest: oklch(0.60 0.18 220);
        --color-df-flag-quest-bg: oklch(0.25 0.08 220);
        --color-df-flag-achievement: oklch(0.70 0.18 70);
        --color-df-flag-achievement-bg: oklch(0.28 0.10 70);
        --color-df-flag-item: oklch(0.60 0.18 150);
        --color-df-flag-item-bg: oklch(0.25 0.08 150);
        --color-df-flag-stat: oklch(0.60 0.18 300);
        --color-df-flag-stat-bg: oklch(0.25 0.08 300);
        --color-df-flag-title: oklch(0.60 0.18 350);
        --color-df-flag-title-bg: oklch(0.25 0.08 350);
        --color-df-flag-global: oklch(0.60 0.18 20);
        --color-df-flag-global-bg: oklch(0.25 0.08 20);
        
        /* Canvas */
        --color-df-canvas-bg: oklch(0.15 0.01 330);
        --color-df-canvas-grid: oklch(0.22 0.02 330);
        
        /* Sidebar */
        --color-df-sidebar-bg: oklch(0.20 0.02 340);
        --color-df-sidebar-border: oklch(0.40 0.05 330);
        --color-df-editor-bg: oklch(0.18 0.02 330);
        --color-df-editor-border: oklch(0.40 0.05 330);
      }
    `,
  },
};

export type ThemeId = keyof typeof themes;

interface ThemeSwitcherProps {
  currentTheme?: ThemeId;
  onThemeChange?: (themeId: ThemeId) => void;
}

export function ThemeSwitcher({ currentTheme = 'dark-fantasy', onThemeChange }: ThemeSwitcherProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(currentTheme);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Apply theme CSS by updating CSS variables in :root
    const theme = themes[selectedTheme];
    if (theme) {
      // Extract CSS variable values from the theme CSS
      const root = document.documentElement;
      const matches = theme.css.matchAll(/--color-df-([\w-]+):\s*([^;]+);/g);
      
      for (const match of matches) {
        const varName = `--color-df-${match[1]}`;
        const value = match[2].trim();
        root.style.setProperty(varName, value);
      }
    }
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
        className="p-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        title="Change Theme"
      >
        <Palette size={14} />
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 min-w-[200px]">
            <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase border-b border-zinc-700">
              Theme
            </div>
            {Object.entries(themes).map(([id, theme]) => (
              <button
                key={id}
                onClick={() => handleThemeChange(id as ThemeId)}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  selectedTheme === id
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="font-medium">{theme.name}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{theme.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

