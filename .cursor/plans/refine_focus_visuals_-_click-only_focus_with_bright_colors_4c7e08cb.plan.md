---
name: Refine Focus Visuals - Click-Only Focus with Bright Colors
overview: Remove hover preview completely, use click-only focus, apply brighter theme colors consistently across tabs/badges/borders, make NodePalette header section very colorful, fix tooltips to use proper node type labels, and ensure breadcrumbs always show with home icon.
todos:
  - id: remove-hover-preview
    content: Remove hover preview completely - only click-based focus in both editors
    status: completed
  - id: use-brighter-colors
    content: Use brighter theme colors (--color-df-info for narrative, --color-df-edge-choice-1 for storylet) consistently
    status: completed
  - id: colorful-nodepalette-header
    content: Make NodePalette header/search section very colorful with background colors matching focused editor
    status: completed
  - id: nodepalette-left-borders
    content: Change NodePalette node items to use left-side borders (border-l-1) with theme colors
    status: completed
  - id: fix-tooltips
    content: Fix tooltips to use FORGE_NODE_TYPE_LABELS instead of descriptions
    status: completed
  - id: always-show-breadcrumbs
    content: Ensure breadcrumbs always show with home icon even when no history exists
    status: completed
  - id: thinner-borders
    content: Change all borders to border-1 (thinner) throughout
    status: completed
---

# Refine Focus Visuals - Click-Only Focus with Bright Colors

## Overview

Remove hover preview completely, use click-only focus, apply brighter theme colors consistently, make NodePalette header section very colorful and easy to see at a glance, fix tooltips, and ensure breadcrumbs always show.

## Color Selection - Brighter Theme Colors

**Narrative Editor**:

- Use `--color-df-edge-choice-2` (oklch(0.60 0.15 280) - bright purple/blue) or `--color-df-info` (oklch(0.65 0.15 220) - bright blue/cyan)
- Matches ACT/CHAPTER nodes (purple/cyan theme)
- Use `--color-df-info` for consistency (bright blue/cyan)

**Storylet Editor**:

- Use `--color-df-edge-choice-1` (oklch(0.55 0.12 15) - warm orange/red) or `--color-df-npc-selected` (oklch(0.72 0.22 150) - vibrant green)
- Matches CHARACTER nodes (warm tones)
- Use `--color-df-edge-choice-1` for warm orange/red theme

## Implementation

### 1. Remove Hover Preview - Click-Only Focus

**Files**:

- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

- Remove `onMouseEnter` and `onMouseLeave` handlers
- Keep only `onClick` handler for focus
- Remove `isClickedRef` and related logic (no longer needed)
- Focus only changes on click

### 2. Use Brighter Theme Colors Consistently

**Files**:

- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`
- `src/components/ForgeWorkspace/components/ForgeSidebar.tsx`
- `src/components/ForgeWorkspace/components/NodePalette.tsx`

- Narrative: Use `--color-df-info` (bright blue/cyan)
- Storylet: Use `--color-df-edge-choice-1` (warm orange/red)
- Apply to: toolbar borders, focus icons, sidebar tabs, badges, NodePalette borders

### 3. Make NodePalette Header Section Very Colorful

**File**: `src/components/ForgeWorkspace/components/NodePalette.tsx`

- Combine header and search into one colorful section
- When `focusedEditor === 'narrative'`: 
- Background: `bg-[var(--color-df-info-bg)]` or similar bright background
- Border: `border-b-[var(--color-df-info)]`
- Text/icons: Use `--color-df-info` color
- When `focusedEditor === 'storylet'`:
- Background: Use warm background matching `--color-df-edge-choice-1`
- Border: `border-b-[var(--color-df-edge-choice-1)]`
- Text/icons: Use `--color-df-edge-choice-1` color
- Make it very visible at a glance

### 4. Change NodePalette Borders to Left-Side

**File**: `src/components/ForgeWorkspace/components/NodePalette.tsx`

- Change from `border-b-1` to `border-l-1` on node items
- Use theme colors: `border-l-[var(--color-df-info)]` for narrative, `border-l-[var(--color-df-edge-choice-1)]` for storylet
- Small, subtle borders

### 5. Fix Tooltips to Use Proper Node Type Labels

**File**: `src/components/ForgeWorkspace/components/NodePalette.tsx`

- Import `FORGE_NODE_TYPE_LABELS` from `@/src/types/ui-constants`
- Replace tooltip content from `nodeInfo.description` to `FORGE_NODE_TYPE_LABELS[nodeInfo.type]`
- This will show "Act", "Chapter", "Player Node", "Character Node", etc. instead of "container" descriptions

### 6. Ensure Breadcrumbs Always Show

**File**: `src/components/ForgeWorkspace/components/GraphBreadcrumbs.tsx`

- Remove the early return when `breadcrumbHistory.length === 0`
- Always show at least the home icon
- Home icon should be visible even when no breadcrumbs exist

### 7. Use Thinner Borders Everywhere

- Change all `border-2` to `border-1` (or `border-t-1`, `border-l-1`, etc.)
- Apply to: editor toolbars, NodePalette items, sidebar tabs

## Files to Modify

1. `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx` - Remove hover, use brighter colors, thinner borders
2. `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx` - Remove hover, use brighter colors, thinner borders
3. `src/components/ForgeWorkspace/components/NodePalette.tsx` - Colorful header, left borders, fix tooltips
4. `src/components/ForgeWorkspace/components/ForgeSidebar.tsx` - Use brighter colors consistently
5. `src/components/ForgeWorkspace/components/GraphBreadcrumbs.tsx` - Always show home icon