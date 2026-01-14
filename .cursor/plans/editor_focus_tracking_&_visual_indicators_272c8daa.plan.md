---
name: Editor Focus Tracking & Visual Indicators
overview: Implement editor focus tracking (hover + click) with visual indicators in the sidebar and dynamic node palette filtering based on the focused editor.
todos:
  - id: extend-viewstate
    content: Add focusedEditor state and setFocusedEditor action to viewState slice
    status: completed
  - id: narrative-focus-handlers
    content: Add mouse event handlers to ForgeNarrativeGraphEditor for focus tracking
    status: completed
    dependencies:
      - extend-viewstate
  - id: storylet-focus-handlers
    content: Add mouse event handlers to ForgeStoryletGraphEditor for focus tracking
    status: completed
    dependencies:
      - extend-viewstate
  - id: update-nodepalette
    content: Update NodePalette to filter nodes based on focusedEditor instead of active graph IDs
    status: completed
    dependencies:
      - extend-viewstate
  - id: sidebar-indicators
    content: Add visual focus indicators to ForgeSidebar tabs and header
    status: completed
    dependencies:
      - extend-viewstate
---

# Editor Focus Tracking & Visual Indicators

## Overview

Add editor focus detection (hover + click) to track which editor (narrative or storylet) is currently focused, with visual indicators in the sidebar and dynamic node palette filtering.

## Architecture

The solution uses the existing Zustand store pattern:

- Add `focusedEditor` state to `viewState` slice
- Editors emit focus events via store actions
- Sidebar and NodePalette consume focus state reactively
- Visual indicators use existing design system colors

## Implementation

### 1. Extend ViewState Slice with Focus Tracking

**File**: `src/components/ForgeWorkspace/store/slices/viewState.slice.ts`

- Add `focusedEditor: "narrative" | "storylet" | null` to `ViewStateSlice`
- Add `setFocusedEditor(editor: "narrative" | "storylet" | null)` action
- Initialize `focusedEditor: null` in default state

### 2. Add Focus Event Handlers to Editors

**Files**:

- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

For each editor:

- Import `useForgeWorkspaceStore` and get `setFocusedEditor` action
- Add wrapper div with event handlers:
- `onMouseEnter`: Set focus to respective editor
- `onMouseLeave`: Clear focus (set to null) - but only if not clicked
- `onClick`: Set persistent focus (clicked state)
- Use a ref to track if editor was clicked (persistent focus)
- Clear focus on mouse leave only if not in clicked state

### 3. Update NodePalette to Filter by Focus

**File**: `src/components/ForgeWorkspace/components/NodePalette.tsx`

- Replace current filtering logic (based on `activeNarrativeGraphId`/`activeStoryletGraphId`)
- Read `focusedEditor` from workspace store
- Filter `allowedNodeTypes` based on `focusedEditor`:
- `"narrative"`: Show `NARRATIVE_FORGE_NODE_TYPE` values
- `"storylet"`: Show storylet node types (CHARACTER, PLAYER, CONDITIONAL, STORYLET, DETOUR)
- `null`: Show all node types (fallback)
- Add visual indicator in header showing which editor is focused

### 4. Add Visual Indicators to ForgeSidebar

**File**: `src/components/ForgeWorkspace/components/ForgeSidebar.tsx`

- Read `focusedEditor` from workspace store
- Add visual badges/indicators to tab buttons:
- Show active indicator (border/background) when respective editor is focused
- Use existing design system colors:
- Narrative: Use narrative-specific color (purple/cyan theme)
- Storylet: Use storylet-specific color (existing NPC color)
- Add header indicator showing current focus state
- Update tab styling to show focus state clearly

### 5. Visual Design Details

**Focus Indicators**:

- **Narrative Editor**: Use purple/cyan accent colors (matching ACT/CHAPTER/PAGE nodes)
- **Storylet Editor**: Use existing NPC/character colors
- **Sidebar Tabs**: Add left border accent when editor is focused
- **NodePalette Header**: Show badge with editor name when focused

**Focus Behavior**:

- **Hover**: Quick preview - sets focus temporarily
- **Click**: Persistent focus - remains until another editor is clicked
- **Mouse Leave**: Clears hover focus, but preserves click focus

## Node Type Mapping

**Narrative Nodes**: ACT, CHAPTER, PAGE, STORYLET, DETOUR, CONDITIONAL
**Storylet Nodes**: CHARACTER, PLAYER, CONDITIONAL, STORYLET, DETOUR
**Overlap**: CONDITIONAL, STORYLET, DETOUR (shown in both when focused)

## Files to Modify

1. `src/components/ForgeWorkspace/store/slices/viewState.slice.ts` - Add focus state
2. `src/components/ForgeWorkspace/store/forge-workspace-store.tsx` - Export new action
3. `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx` - Add focus handlers
4. `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx` - Add focus handlers
5. `src/components/ForgeWorkspace/components/NodePalette.tsx` - Filter by focus
6. `src/components/ForgeWorkspace/components/ForgeSidebar.tsx` - Add visual indicators

## Testing Considerations

- Verify focus persists on click
- Verify hover shows preview focus
- Verify node palette updates reactively
- Verify visual indicators update correctly
- Test edge cases: rapid hover/click, switching between editors