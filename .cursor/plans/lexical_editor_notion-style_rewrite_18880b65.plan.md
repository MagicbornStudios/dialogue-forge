---
name: Lexical Editor Notion-Style Rewrite
overview: Rewrite the Lexical editor to be Notion-style (block-based with drag handles + top toolbar) using playground plugins, remove unnecessary demo/test files, and update all styling to use the df-* theme system.
todos:
  - id: remove-demo-files
    content: "Remove demo/test files: App.tsx, Settings.tsx, TestRecorderPlugin, PasteLogPlugin, DocsPlugin, TypingPerfPlugin, unused themes"
    status: completed
  - id: update-theme-css
    content: Update PlaygroundEditorTheme.css to use df-* CSS variables instead of hardcoded colors
    status: completed
  - id: update-editor-structure
    content: Ensure LexicalEditor.tsx has proper Notion-style layout (toolbar top + block handles left)
    status: completed
  - id: update-toolbar-styling
    content: Update ToolbarPlugin to use theme variables and Shadcn components with proper Notion-style subtle appearance
    status: completed
  - id: update-block-handles
    content: Ensure BlockHandlePlugin uses theme variables and appears on left side with proper hover states
    status: completed
  - id: update-ui-components
    content: Update all UI components (Button, DropDown, Dialog, etc.) to use df-* theme variables
    status: completed
  - id: update-plugin-css
    content: Update all plugin CSS files to use df-* theme variables (DraggableBlockPlugin, FloatingTextFormatToolbarPlugin, etc.)
    status: completed
  - id: update-index-css
    content: Clean up index.css - remove playground-specific styles, ensure full-width/height, use theme variables
    status: completed
  - id: verify-layout
    content: Verify editor takes full page, blocks have proper spacing, drag handles work, slash commands work
    status: completed
isProject: false
---

# Lexical Editor Notion-Style Rewrite

## Overview

Transform the Lexical editor into a Notion-style block-based editor with:

- Top toolbar (Google Docs style)
- Left-side drag handles (Notion style)
- Playground plugins and functionality
- Full theming integration with df-* CSS variables
- Clean, minimal codebase (remove demo/test files)

## File Structure Analysis

### Files to Remove (Demo/Test/Unused)

- `App.tsx` - Playground app wrapper (not needed)
- `Settings.tsx` - Playground settings UI (not needed)
- `plugins/TestRecorderPlugin/` - Test/debug tool
- `plugins/PasteLogPlugin/` - Debug tool
- `plugins/DocsPlugin/` - Documentation plugin
- `plugins/TypingPerfPlugin/` - Performance testing
- `themes/StickyEditorTheme.*` - Unused theme
- `themes/CommentEditorTheme.*` - Unused theme (unless using comments)
- `collaboration.ts` - Only if not using collaboration
- `commenting/` - Only if not using comments
- `server/validation.ts` - Review if needed
- `buildHTMLConfig.tsx` - Review if needed

### Files to Keep & Update

- Core editor: `LexicalEditor.tsx`
- Plugins: All functional plugins (keep playground plugins)
- Nodes: All playground nodes
- UI components: Update to use Shadcn + theme variables
- Contexts: Keep all (SettingsContext, ToolbarContext, FlashMessageContext)
- Themes: Keep only `PlaygroundEditorTheme` (update CSS to use df-* variables)

## Implementation Plan

### 1. Clean Up Unnecessary Files

- Delete `App.tsx`, `Settings.tsx`
- Delete test plugins: `TestRecorderPlugin`, `PasteLogPlugin`, `DocsPlugin`, `TypingPerfPlugin`
- Delete unused themes: `StickyEditorTheme`, `CommentEditorTheme` (unless needed)
- Remove collaboration files if not using collaboration
- Clean up `index.css` - remove playground-specific styles, keep only editor styles

### 2. Update Theme System

- **Update `PlaygroundEditorTheme.css`**: Replace hardcoded colors with df-* CSS variables
- Text colors: `var(--df-text-primary)`, `var(--df-text-secondary)`, `var(--df-text-tertiary)`
- Backgrounds: `var(--df-editor-bg)`, `var(--df-surface)`
- Borders: `var(--df-node-border)`, `var(--df-editor-border)`
- Highlights: `var(--df-node-selected)`
- **Update `theme.ts`**: Keep using PlaygroundEditorTheme but ensure CSS variables are used
- **Update `ContentEditable.css`**: Use theme variables for colors and backgrounds

### 3. Update Editor Structure (LexicalEditor.tsx)

- Ensure proper flex layout for full-width/full-height
- Keep ToolbarPlugin at top
- Keep DraggableBlockPlugin for left-side handles
- Use BlockHandlePlugin (custom) instead of DraggableBlockPlugin if it's better styled
- Ensure editor-container takes full space
- Fix editor state initialization (already done, verify)

### 4. Update ToolbarPlugin Styling

- Replace hardcoded colors with df-* variables
- Update button styles to use Shadcn Button component
- Update dropdowns to use Shadcn DropdownMenu
- Ensure toolbar blends with background (subtle, Notion-style)
- Use theme colors for icons and text

### 5. Update Block Handles (Notion-Style)

- Use `BlockHandlePlugin.tsx` (custom) - already uses theme variables
- Ensure handles appear on left side of blocks
- Style with df-* variables
- Add hover states using theme colors
- Ensure handles are visible but subtle

### 6. Update UI Components

- **Button.tsx**: Already wraps Shadcn - verify theme integration
- **DropDown.tsx**: Update to use Shadcn DropdownMenu with theme
- **Dialog.tsx**: Already wraps Shadcn - verify
- **TextInput.tsx**: Update to use theme variables
- **ColorPicker**: Update to use theme colors
- Remove or update any UI components that don't use Shadcn

### 7. Update CSS Files

- **index.css**: 
- Remove playground-specific styles (editor-shell, etc.)
- Keep only editor-container, editor-scroller, editor styles
- Use df-* variables throughout
- Ensure full-width/full-height layout
- **ContentEditable.css**: Already updated with theme variables
- **Plugin CSS files**: Update each plugin's CSS to use df-* variables
- DraggableBlockPlugin/index.css
- FloatingTextFormatToolbarPlugin/index.css
- FloatingLinkEditorPlugin/index.css
- TableCellResizer/index.css
- etc.

### 8. Update Plugin Styling

- Go through each plugin CSS file and replace hardcoded colors
- Use df-* variables for:
- Backgrounds
- Text colors
- Borders
- Hover states
- Active states

### 9. Ensure Notion-Style Features

- Block-based editing (already via DraggableBlockPlugin)
- Slash commands (ComponentPickerPlugin - already working)
- Drag handles on left (BlockHandlePlugin or DraggableBlockPlugin)
- Clean toolbar at top (ToolbarPlugin)
- Floating format toolbar (FloatingTextFormatToolbarPlugin)
- Block menu on hover (via drag handles)

### 10. Layout & Spacing

- Update padding/margins to match Notion's clean spacing
- Ensure blocks have proper spacing between them
- Update ContentEditable padding to match Notion (left padding for drag handle space)
- Ensure editor-scroller has proper overflow handling

## Key Files to Modify

### Core Files

- `LexicalEditor.tsx` - Structure and layout
- `theme.ts` - Theme configuration
- `themes/PlaygroundEditorTheme.css` - Main theme CSS with df-* variables
- `ui/ContentEditable.css` - Editor content styling
- `index.css` - Editor container styling

### Plugin Files (Update CSS)

- `plugins/ToolbarPlugin/index.tsx` - Update component styling
- `plugins/DraggableBlockPlugin/index.css` - Theme variables
- `plugins/BlockHandlePlugin.tsx` - Already themed, verify
- `plugins/FloatingTextFormatToolbarPlugin/index.css` - Theme variables
- `plugins/FloatingLinkEditorPlugin/index.css` - Theme variables
- All other plugin CSS files

### UI Component Files

- Update all UI components to use df-* theme variables
- Ensure Shadcn components are properly themed

## Testing Checklist

- [ ] Editor takes full width/height
- [ ] Toolbar appears at top with proper styling
- [ ] Drag handles appear on left side of blocks
- [ ] All colors use theme variables (dark/light mode works)
- [ ] Slash commands work
- [ ] Block dragging works
- [ ] Floating toolbars styled correctly
- [ ] No hardcoded colors remain
- [ ] Editor is functional and writable