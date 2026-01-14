---
name: Resizable Panels with Workspace Store Persistence
overview: Implement resizable panels using react-resizable-panels and shadcn components, with conditional panels and workspace store persistence via localStorage.
todos:
  - id: install-resizable-panels
    content: Install react-resizable-panels and add shadcn resizable component
    status: completed
  - id: add-panel-state-slice
    content: Add panel layout state to viewState slice with localStorage persistence
    status: completed
  - id: create-panel-layout
    content: Replace ResizablePanel with react-resizable-panels in ForgeWorkspace
    status: completed
    dependencies:
      - install-resizable-panels
      - add-panel-state-slice
  - id: add-conditional-panels
    content: Add toggle buttons to show/hide sidebar and editors
    status: completed
    dependencies:
      - create-panel-layout
  - id: add-persistence
    content: Wire up localStorage persistence for panel layout state
    status: completed
    dependencies:
      - add-panel-state-slice
---

# Resizable Panels with Workspace Store Persistence

## Overview

This plan focuses on implementing a sophisticated resizable panel system using:

- **react-resizable-panels**: Core library for resizable panels (used by shadcn)
- **shadcn/ui Resizable component**: Pre-built component wrapper
- **Workspace Store**: State management with localStorage persistence
- **Conditional Panels**: Toggle sidebar and editors on/off

**Deferred**: Project creation and automatic graph loading will be handled in a separate plan.

## Phase 1: Install Dependencies and Add shadcn Resizable Component

### 1.1 Install react-resizable-panels

**File**: `package.json`

**Command**:

```bash
npm install react-resizable-panels
```

**Note**: shadcn's resizable component is built on top of this library.

### 1.2 Add shadcn Resizable Component

**File**: Run shadcn CLI command:

```bash
npx shadcn@latest add resizable
```

This will create:

- `src/components/ui/resizable.tsx`

**Reference**: [shadcn Resizable Documentation](https://ui.shadcn.com/docs/components/resizable)

## Phase 2: Add Panel Layout State to Workspace Store

### 2.1 Extend ViewState Slice

**File**: `src/components/ForgeWorkspace/store/slices/viewState.slice.ts`

**Add Panel Layout State**:

```typescript
export interface PanelLayoutState {
  sidebar: {
    size: number; // Percentage (0-100)
    visible: boolean;
  };
  narrativeEditor: {
    size: number; // Percentage (0-100)
    visible: boolean;
  };
  storyletEditor: {
    size: number; // Percentage (0-100)
    visible: boolean;
  };
}

export interface ViewStateSlice {
  // ... existing fields
  panelLayout: PanelLayoutState;
}

export interface ViewStateActions {
  // ... existing actions
  setPanelLayout: (layout: Partial<PanelLayoutState>) => void;
  togglePanel: (panel: 'sidebar' | 'narrativeEditor' | 'storyletEditor') => void;
  resetPanelLayout: () => void;
}
```

**Default State**:

```typescript
const defaultPanelLayout: PanelLayoutState = {
  sidebar: { size: 20, visible: true },
  narrativeEditor: { size: 40, visible: true },
  storyletEditor: { size: 60, visible: true },
};
```

### 2.2 Add localStorage Persistence Middleware

**File**: `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`

**Add Persist Middleware**:

- Use Zustand's `persist` middleware for localStorage
- Only persist `panelLayout` from viewState slice
- Key: `forge-workspace-panel-layout`

**Implementation**:

```typescript
import { persist } from 'zustand/middleware';

// In createForgeWorkspaceStore, wrap with persist middleware
return createStore<ForgeWorkspaceState>()(
  devtools(
    persist(
      immer((set, get) => {
        // ... existing store creation
      }),
      {
        name: 'forge-workspace-panel-layout',
        partialize: (state) => ({
          // Only persist panel layout
          viewState: {
            panelLayout: state.viewState.panelLayout,
          },
        }),
      }
    ),
    { name: "ForgeWorkspaceStore" }
  )
);
```

**Note**: We'll need to handle hydration properly for SSR compatibility.

## Phase 3: Implement Resizable Panel Layout

### 3.1 Update ForgeWorkspace Component

**File**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`

**Replace Current Layout** with react-resizable-panels:

```typescript
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useForgeWorkspaceStore } from './store/forge-workspace-store';
import { Eye, EyeOff, PanelLeftClose, PanelRightClose } from 'lucide-react';

function ForgeWorkspaceContent({ ... }) {
  const panelLayout = useForgeWorkspaceStore((s) => s.viewState.panelLayout);
  const setPanelLayout = useForgeWorkspaceStore((s) => s.actions.setPanelLayout);
  const togglePanel = useForgeWorkspaceStore((s) => s.actions.togglePanel);

  return (
    <div className="flex h-full w-full flex-col">
      <ForgeWorkspaceToolbar ... />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Sidebar */}
        {panelLayout.sidebar.visible && (
          <>
            <ResizablePanel
              defaultSize={panelLayout.sidebar.size}
              minSize={15}
              maxSize={40}
              collapsible
              onResize={(size) => setPanelLayout({ sidebar: { ...panelLayout.sidebar, size } })}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-2 py-1 border-b border-df-control-border">
                  <span className="text-xs font-medium text-df-text-secondary">Storylets</span>
                  <button
                    onClick={() => togglePanel('sidebar')}
                    className="p-1 rounded hover:bg-df-control-bg"
                    title="Hide sidebar"
                  >
                    <EyeOff size={12} className="text-df-text-tertiary" />
                  </button>
                </div>
                <StoryletsSidebar className="flex-1 overflow-auto" />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Editor Area */}
        <ResizablePanel defaultSize={panelLayout.sidebar.visible ? 80 : 100} minSize={60}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Narrative Editor */}
            {panelLayout.narrativeEditor.visible && narrativeGraph && (
              <>
                <ResizablePanel
                  defaultSize={panelLayout.narrativeEditor.size}
                  minSize={20}
                  maxSize={80}
                  collapsible
                  onResize={(size) => setPanelLayout({ narrativeEditor: { ...panelLayout.narrativeEditor, size } })}
                >
                  <div className="h-full flex flex-col border border-df-node-border rounded-lg bg-df-editor-bg">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-df-control-border">
                      <span className="text-xs font-medium text-df-text-secondary">Narrative Graph</span>
                      <button
                        onClick={() => togglePanel('narrativeEditor')}
                        className="p-1 rounded hover:bg-df-control-bg"
                        title="Hide narrative editor"
                      >
                        <EyeOff size={12} className="text-df-text-tertiary" />
                      </button>
                    </div>
                    <ForgeNarrativeGraphEditor 
                      graph={narrativeGraph} 
                      onChange={onNarrativeGraphChange} 
                      className="flex-1 min-h-0" 
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Storylet Editor */}
            {panelLayout.storyletEditor.visible && storyletGraph && (
              <ResizablePanel
                defaultSize={panelLayout.storyletEditor.size}
                minSize={20}
                maxSize={80}
                collapsible
                onResize={(size) => setPanelLayout({ storyletEditor: { ...panelLayout.storyletEditor, size } })}
              >
                <div className="h-full flex flex-col border border-df-node-border rounded-lg bg-df-editor-bg">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-df-control-border">
                    <span className="text-xs font-medium text-df-text-secondary">Storylet Graph</span>
                    <button
                      onClick={() => togglePanel('storyletEditor')}
                      className="p-1 rounded hover:bg-df-control-bg"
                      title="Hide storylet editor"
                    >
                      <EyeOff size={12} className="text-df-text-tertiary" />
                    </button>
                  </div>
                  <ForgeStoryletGraphEditor
                    graph={storyletGraph}
                    onChange={onStoryletGraphChange}
                    flagSchema={activeFlagSchema}
                    gameState={activeGameState}
                    characters={characters}
                    className="flex-1 min-h-0"
                  />
                </div>
              </ResizablePanel>
            )}

            {/* Empty states when panels are hidden */}
            {!panelLayout.narrativeEditor.visible && !panelLayout.storyletEditor.visible && (
              <div className="flex items-center justify-center h-full text-df-text-secondary text-sm">
                All editors are hidden. Use the toolbar to show them.
              </div>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

### 3.2 Add Panel Toggle Buttons to Toolbar

**File**: `src/components/ForgeWorkspace/components/ForgeWorkspaceToolbar.tsx`

**Add Panel Toggle Buttons**:

- Show/hide sidebar button
- Show/hide narrative editor button
- Show/hide storylet editor button
- Visual indicators (Eye/EyeOff icons) for visibility state

## Phase 4: Handle Panel Collapse and Restoration

### 4.1 Handle Collapsed Panels

**Implementation**:

- When a panel is collapsed (size = 0), mark it as hidden
- Store collapsed state in panelLayout
- Provide restore button in toolbar or collapsed panel handle

### 4.2 Restore Hidden Panels

**File**: `src/components/ForgeWorkspace/components/ForgeWorkspaceToolbar.tsx`

**Add Restore Buttons**:

- Show restore buttons for hidden panels
- Clicking restore button sets panel visible and gives it default size

## Implementation Details

### react-resizable-panels Features Used

1. **ResizablePanelGroup**: Container for panels
2. **ResizablePanel**: Individual resizable panel
3. **ResizableHandle**: Drag handle between panels
4. **collapsible prop**: Allows panels to collapse to 0
5. **onResize callback**: Track size changes for persistence
6. **defaultSize prop**: Initial panel size

**Reference**: [react-resizable-panels Documentation](https://react-resizable-panels.vercel.app/)

### Conditional Panels Pattern

**Reference**: [Conditional Panels Example](https://react-resizable-panels.vercel.app/examples/conditional-panels)

**Implementation**:

- Conditionally render panels based on `panelLayout.{panel}.visible`
- When panel is hidden, remaining panels adjust automatically
- Use `collapsible` prop to allow panels to collapse to 0

### Persistent Layout Pattern

**Reference**: [Persistent Layout Example](https://react-resizable-panels.vercel.app/examples/persistent-layout)

**Implementation**:

- Use `onResize` callbacks to update workspace store
- Workspace store persists to localStorage via Zustand persist middleware
- On mount, restore panel sizes from persisted state

### Nested Groups

**Reference**: [Nested Groups Example](https://react-resizable-panels.vercel.app/examples/nested-groups)

**Layout Structure**:

```
ResizablePanelGroup (horizontal)
  ├─ ResizablePanel (sidebar) - conditional
  ├─ ResizableHandle - conditional
  └─ ResizablePanel (main area)
      └─ ResizablePanelGroup (vertical)
          ├─ ResizablePanel (narrative) - conditional
          ├─ ResizableHandle - conditional
          └─ ResizablePanel (storylet) - conditional
```

## Files to Modify/Create

1. `package.json` - Add react-resizable-panels dependency
2. `src/components/ui/resizable.tsx` - Add via shadcn CLI
3. `src/components/ForgeWorkspace/store/slices/viewState.slice.ts` - Add panel layout state
4. `src/components/ForgeWorkspace/store/forge-workspace-store.tsx` - Add persist middleware
5. `src/components/ForgeWorkspace/ForgeWorkspace.tsx` - Replace layout with resizable panels
6. `src/components/ForgeWorkspace/components/ForgeWorkspaceToolbar.tsx` - Add panel toggle buttons
7. `src/components/ForgeWorkspace/components/ResizablePanel.tsx` - DEPRECATE (can be removed after migration)

## Notes

- **No drag-and-drop library needed**: react-resizable-panels handles all resizing
- **Workspace store persistence**: Clean integration with existing patterns
- **Conditional rendering**: Panels can be toggled on/off for more workspace
- **Nested groups**: Support for complex layouts (horizontal sidebar + vertical editors)
- **Session persistence**: Layout saved to localStorage, restored on app load