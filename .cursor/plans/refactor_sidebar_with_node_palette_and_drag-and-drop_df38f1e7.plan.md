---
name: Refactor Sidebar with Node Palette and Drag-and-Drop
overview: Refactor workspace UI to be cleaner, sharper (Photoshop/Spotify style), add node palette with drag-and-drop, move project switching into workspace, fix data loading, and improve theme styling.
todos: []
---

# Refactor Sidebar with Node Palette and Drag-and-Drop

## Overview

Refactor the workspace to be cleaner, sharper, and more professional (Photoshop/Spotify aesthetic). Add a tabbed sidebar with minimal storylet list and drag-and-drop node palette. Move project switching into workspace header. Fix SSR issues, data loading timing, and improve theme styling. Keep panel visibility state but remove resizing functionality.

## Key Changes

1. **Fix SSR localStorage issue** - Guard localStorage access for server-side rendering
2. **Keep panel visibility, remove resizing** - Maintain show/hide functionality but disable resizing
3. **New layout** - Narrative graph on top, storylet graph on bottom, sidebar on left
4. **Refactor StoryletsSidebar** - Minimal, icon-based, sleek shadcn style, more editor-like
5. **Create Node Palette** - Drag-and-drop node creation with type restrictions
6. **Create tabbed sidebar wrapper** - Tabs for Storylets and Node Palette
7. **Move project switching** - Integrate ProjectSwitcher into workspace header
8. **Add optional header links** - Admin and API links in workspace header
9. **Fix data loading** - Only load data after project is set, not on app launch
10. **Improve theme** - Modern Spotify-style dark fantasy theme
11. **Fix view mode spacing** - Reduce spacing in graph/yarn/play mode buttons
12. **Use shadcn extensively** - Replace custom components with shadcn where possible

## Implementation Details

### 1. Fix SSR localStorage Issue

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

- Wrap localStorage access in `typeof window !== 'undefined'` checks
- Use `useEffect` for initial state hydration after mount
- Default to safe values during SSR
```typescript
const [layoutType, setLayoutType] = useState<PanelLayoutType>('sidebar-vertical');

useEffect(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('forge-panel-layout-type');
    if (saved) setLayoutType(saved as PanelLayoutType);
  }
}, []);
```


### 2. Keep Panel Visibility, Remove Resizing

**Files to modify**:

- `src/components/ForgeWorkspace/ForgeWorkspace.tsx`
- `src/components/ForgeWorkspace/components/ForgeWorkspaceMenuBar.tsx`

**Changes**:

- **KEEP** `panelVisibility` state and toggle functionality
- **KEEP** panel visibility checkboxes in menu bar
- **REMOVE** `panelSizes` tracking
- **REMOVE** `onResize` handlers
- **REMOVE** `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` usage
- Use simple conditional rendering based on `panelVisibility`
- Use fixed layout with flexbox/grid instead of resizable panels

### 3. New Layout Structure

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

**Layout**:

- Sidebar on left (fixed width, collapsible via visibility toggle)
- Main area on right:
  - Narrative graph editor on top (50% height)
  - Storylet graph editor on bottom (50% height)
- Use CSS Grid or Flexbox for layout (no react-resizable-panels)
```typescript
<div className="flex h-full">
  {panelVisibility.sidebar && (
    <div className="w-[280px] border-r">
      <ForgeSidebar />
    </div>
  )}
  <div className="flex-1 flex flex-col">
    {panelVisibility['narrative-editor'] && (
      <div className="flex-1 border-b">
        <ForgeNarrativeGraphEditor />
      </div>
    )}
    {panelVisibility['storylet-editor'] && (
      <div className="flex-1">
        <ForgeStoryletGraphEditor />
      </div>
    )}
  </div>
</div>
```


### 4. Create Forge Project Switcher

**File**: `src/components/ForgeWorkspace/components/ForgeProjectSwitcher.tsx` (NEW)

**Changes**:

- Create new project switcher component specifically for forge workspace
- Keep existing `ProjectSwitcher` in `components/` for use elsewhere (no changes)
- Make it compact, editor-like design
- Use shadcn components (DropdownMenu, Button, Dialog)
- Integrate with workspace store for project selection
- Support creating new projects

**Features**:

- Compact dropdown with project list
- Create project dialog
- Icon-based design
- Integrates with `useForgeWorkspaceStore` for project state

### 5. Add Scalable Header Links

**File**: `src/components/ForgeWorkspace/components/ForgeWorkspaceMenuBar.tsx`

**Changes**:

- Add `headerLinks` prop as optional array of link objects
- Each link object: `{ label: string, href: string, icon: ReactNode, target?: string }`
- Only render links section if array is provided and not empty
- Use shadcn Button components for links
- Icon + label compact design

**New props**:

```typescript
interface HeaderLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  target?: string; // default: '_blank'
}

interface ForgeWorkspaceProps {
  // ... existing props
  headerLinks?: HeaderLink[]; // Optional array of header links
  onProjectChange?: (projectId: number | null) => void;
}
```

**Example usage**:

```typescript
<ForgeWorkspace
  headerLinks={[
    { label: 'Admin', href: '/admin', icon: <Settings /> },
    { label: 'API', href: '/api/graphql-playground', icon: <Code /> }
  ]}
/>
```

### 6. Fix Data Loading Timing

**File**: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`

**Changes**:

- Ensure data loading only happens when `selectedProjectId` is set (not null)
- Add guard to prevent loading on initial mount if no project selected
- Only trigger subscription when project is actually selected
```typescript
domainStore.subscribe(
  (state) => state.selectedProjectId,
  async (selectedProjectId) => {
    // Don't load if no project selected
    if (!selectedProjectId) {
      state.actions.setActiveNarrativeGraphId(null)
      state.actions.setActiveStoryletGraphId(null)
      return
    }
    
    // Only then load data...
  }
)
```


### 7. Improve Theme Styling

**Files to modify**:

- `src/styles/theme.css` or theme configuration
- All workspace components for consistent styling

**Changes**:

- Update dark fantasy theme to be more modern, Spotify-like
- Use subtle borders, better contrast
- Reduce visual noise
- Use shadcn's default theme variables where possible
- Ensure consistent spacing and typography

**Spotify-style characteristics**:

- Subtle backgrounds (not pure black)
- Minimal borders (thin, low opacity)
- Better contrast for text
- Smooth transitions
- Icon-focused UI

### 8. Fix View Mode Spacing

**Files to modify**:

- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`

**Changes**:

- Reduce spacing in view mode toggle buttons
- Use shadcn ButtonGroup or compact button layout
- Make buttons more compact (smaller padding)
- Use icon-only or icon+label compact style

**Current issue**: View mode buttons have too much spacing between them

**Solution**: Use `ButtonGroup` or reduce gap/padding, make more compact

### 9. Create Shared Search Component

**File**: `src/components/ForgeWorkspace/components/SearchInput.tsx` (NEW)

- Reusable search input component with icon
- Accepts `placeholder`, `value`, `onChange` props
- Shadcn Input component with Search icon
- Minimal, sleek styling
- Compact design

### 10. Refactor StoryletsSidebar to Minimal, Editor-like Design

**File**: `src/components/ForgeWorkspace/components/StoryletsSidebar.tsx`

**Changes**:

- Use `SearchInput` component
- Make list items more compact with icons only
- Remove verbose text, show only essential info
- Use shadcn Button/Card components
- Icon-based actions (hover tooltips)
- Compact header with icon + count badge
- More "editor-like" - professional, powerful appearance
- Use shadcn Badge, Button, Card components

**Design goals**:

- Minimal, clean
- Icon-focused
- Professional editor aesthetic
- Similar to VS Code sidebar or Photoshop panels

### 10. Create Node Palette Component

**File**: `src/components/ForgeWorkspace/components/NodePalette.tsx` (NEW)

**Features**:

- Display available node types based on active editor (narrative vs storylet)
- Use `NARRATIVE_FORGE_NODE_TYPE` and `FORGE_NODE_TYPE` constants
- Group nodes by category (e.g., "Dialogue", "Structure", "Logic")
- Icons for each node type (lucide-react)
- Drag-and-drop support using **neodrag** library (cross-platform compatible)
- Search functionality using `SearchInput` component
- Disabled state for nodes not allowed in current graph type
- Compact, icon-based design

**Drag-and-drop implementation**:

- Use **neodrag** library for drag-and-drop (better than HTML5 DnD API)
- Install: `npm install neodrag`
- Use neodrag's `useDraggable` hook or component wrapper
- On drop in graph editors, use `screenToFlowPosition` from `useReactFlow` hook
- Create new node with appropriate type and position
- Validate node type is allowed for graph kind

**Node type icons** (lucide-react):

- ACT: `BookOpen`
- CHAPTER: `FileText`
- PAGE: `File`
- PLAYER: `User`
- CHARACTER: `Users`
- CONDITIONAL: `GitBranch`
- DETOUR: `ArrowRightLeft`
- STORYLET: `Layers`
- JUMP: `ArrowRight`
- END: `CircleStop`

### 12. Create Tabbed Sidebar Wrapper

**File**: `src/components/ForgeWorkspace/components/ForgeSidebar.tsx` (NEW)

**Structure**:

- Use shadcn Tabs component
- Two tabs: "Storylets" and "Nodes"
- Wrap `StoryletsSidebar` and `NodePalette` components
- Determine active editor context (narrative vs storylet) from workspace store
- Pass active editor context to `NodePalette`
- Compact tab design

**Active editor detection**:

- Read `activeNarrativeGraphId` and `activeStoryletGraphId` from workspace store
- If narrative graph active → show narrative node types
- If storylet graph active → show storylet node types
- If neither active → show all or default to storylet

### 13. Integrate Drag-and-Drop in Graph Editors

**Note**: Using neodrag instead of HTML5 Drag and Drop API

**Files to modify**:

- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

**Changes**:

- Add `onDrop` handler to ReactFlow component
- Add `onDragOver` handler (prevent default, set drop effect)
- Use `screenToFlowPosition` to convert drop coordinates
- Create new node with appropriate type and position
- Validate node type is allowed for graph kind
- Add node to graph using editor actions

**Node type validation**:

- Narrative graphs: Only allow `NARRATIVE_FORGE_NODE_TYPE` values
- Storylet graphs: Only allow `CHARACTER`, `PLAYER`, `CONDITIONAL`, `STORYLET`, `DETOUR`

### 14. Create Drag Context for Node Type

**File**: `src/components/ForgeWorkspace/hooks/useNodeDrag.tsx` (NEW)

- Context provider for drag state (works with neodrag)
- Stores dragged node type
- Provides `setDraggedNodeType` and `draggedNodeType`
- Integrates with neodrag's drag events

### 15. Update Page to Remove Header

**File**: `app/(forge-app)/page.tsx`

**Changes**:

- Remove `ProjectSwitcher` from page (keep it for use elsewhere)
- Remove header div wrapper
- Pass project selection state to `ForgeWorkspace`
- Pass `headerLinks` array with Admin/API links (optional)
- Make workspace full height
```typescript
import { Settings, Code } from 'lucide-react';

export default function DialogueForgeApp() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  return (
    <ForgeWorkspace
      className="h-screen"
      toolbarActions={<ThemeSwitcher />}
      dataAdapter={makePayloadForgeAdapter()}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
      headerLinks={[
        { label: 'Admin', href: '/admin', icon: <Settings size={14} /> },
        { label: 'API', href: '/api/graphql-playground', icon: <Code size={14} /> }
      ]}
    />
  );
}
```


## File Structure

```
src/components/ForgeWorkspace/
├── components/
│   ├── ForgeSidebar.tsx (NEW - tabbed wrapper)
│   ├── StoryletsSidebar.tsx (REFACTOR - minimal, editor-like design)
│   ├── NodePalette.tsx (NEW - drag-and-drop node palette with neodrag)
│   ├── SearchInput.tsx (NEW - shared search component)
│   ├── ForgeProjectSwitcher.tsx (NEW - forge-specific project switcher)
│   └── ForgeWorkspaceMenuBar.tsx (REFACTOR - add ForgeProjectSwitcher, headerLinks, keep panel toggles)
├── hooks/
│   └── useNodeDrag.tsx (NEW - drag context for neodrag)
└── ForgeWorkspace.tsx (REFACTOR - new layout, fix SSR, add header)

app/(forge-app)/
└── page.tsx (REFACTOR - remove header, pass props to workspace)

components/
└── ProjectSwitcher.tsx (KEEP - for use elsewhere, no changes)
```

## Node Type Restrictions

Based on `src/types/forge/forge-graph.ts`:

**Narrative Graphs** (`NARRATIVE_FORGE_NODE_TYPE`):

- ACT
- CHAPTER
- PAGE
- STORYLET
- DETOUR
- CONDITIONAL

**Storylet Graphs** (subset of `FORGE_NODE_TYPE`):

- CHARACTER
- PLAYER
- CONDITIONAL
- STORYLET
- DETOUR

## Design Principles

1. **Minimal and Clean** - Reduce visual noise, focus on content
2. **Icon-Focused** - Use icons extensively, text only when necessary
3. **Professional Editor Aesthetic** - Like VS Code, Photoshop, Spotify
4. **Consistent Spacing** - Tight, professional spacing throughout
5. **Modern Theme** - Spotify-style dark theme, not pure black
6. **Shadcn First** - Use shadcn components wherever possible
7. **Compact UI** - Maximize workspace, minimize chrome

## Dependencies

**New packages to install**:

- `neodrag` - Cross-platform drag-and-drop library
```bash
npm install neodrag
```


## References

- Neodrag: https://github.com/PuruVJ/neodrag
- React Flow Drag and Drop: https://reactflow.dev/examples/interaction/drag-and-drop
- Node type constants: `src/types/forge/forge-graph.ts`
- Shadcn Tabs: https://ui.shadcn.com/docs/components/tabs
- Shadcn Input: https://ui.shadcn.com/docs/components/input
- Shadcn Button: https://ui.shadcn.com/docs/components/button
- Shadcn Card: https://ui.shadcn.com/docs/components/card
- Shadcn DropdownMenu: https://ui.shadcn.com/docs/components/dropdown-menu