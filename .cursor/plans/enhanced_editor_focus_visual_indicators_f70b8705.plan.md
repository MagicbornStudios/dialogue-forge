---
name: Enhanced Editor Focus Visual Indicators
overview: Add colored borders to editors when focused, add right-side borders to NodePalette items matching the focused editor color, and enhance visual feedback throughout the UI.
todos:
  - id: narrative-editor-border
    content: Add purple focus border to ForgeNarrativeGraphEditor when focused
    status: completed
  - id: storylet-editor-border
    content: Add blue focus border to ForgeStoryletGraphEditor when focused
    status: completed
  - id: nodepalette-right-borders
    content: Add right-side borders to NodePalette items matching focused editor color
    status: completed
  - id: editor-focus-icons
    content: Add focus indicator icons to editor toolbars when focused
    status: completed
---

# Enhanced Editor Focus Visual Indicators

## Overview

Add comprehensive visual feedback for editor focus with colored borders, icons, and enhanced NodePalette styling to clearly distinguish between narrative and storylet editors.

## Color Scheme

**Narrative Editor** (Purple/Cyan theme):

- Border color: `#8b5cf6` (purple, matching ACT nodes) or `#06b6d4` (cyan, matching CHAPTER nodes)
- Use purple as primary focus color

**Storylet Editor** (Blue/Red theme):

- Border color: `#3b82f6` (blue) or use existing NPC/character colors
- Use blue as primary focus color

## Implementation

### 1. Add Focus Border to Narrative Graph Editor

**File**: `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`

- Read `focusedEditor` from workspace store
- Add conditional border styling to the main editor container div
- When `focusedEditor === 'narrative'`, apply purple border (`border-2 border-purple-500` or similar)
- Add transition for smooth border color changes

### 2. Add Focus Border to Storylet Graph Editor

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

- Read `focusedEditor` from workspace store
- Add conditional border styling to the main editor container div
- When `focusedEditor === 'storylet'`, apply blue border (`border-2 border-blue-500` or similar)
- Add transition for smooth border color changes

### 3. Add Right-Side Border to NodePalette Items

**File**: `src/components/ForgeWorkspace/components/NodePalette.tsx`

- Read `focusedEditor` from workspace store
- In the node item rendering, add conditional right-side border
- When `focusedEditor === 'narrative'`, add `border-r-2 border-r-purple-500`
- When `focusedEditor === 'storylet'`, add `border-r-2 border-r-blue-500`
- Apply to the draggable node item divs
- Add transition for smooth border appearance

### 4. Add Visual Icons/Indicators to Editors

**Files**:

- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

- Add a small icon/badge in the editor toolbar when focused
- Use lucide-react icons (e.g., `Focus` or `Target` icon)
- Position in the toolbar header area
- Color match the border color

### 5. Enhanced Color Variables (Optional)

If we want to use CSS variables for consistency:

- Add `--color-df-narrative-focus: #8b5cf6` (purple)
- Add `--color-df-storylet-focus: #3b82f6` (blue)
- Use these in the components for consistency

## Files to Modify

1. `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx` - Add focus border and indicator
2. `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx` - Add focus border and indicator
3. `src/components/ForgeWorkspace/components/NodePalette.tsx` - Add right-side borders to items

## Visual Design Details

**Editor Borders**:

- 2px solid border when focused
- Smooth transition on focus change
- Border wraps entire editor container

**NodePalette Items**:

- Right-side 2px border on each draggable item
- Border color matches focused editor
- Smooth transition when focus changes
- Border appears on hover as well (existing left border + new right border)

**Icons**:

- Small icon in editor toolbar when focused
- Subtle, doesn't interfere with existing UI
- Color matches border color