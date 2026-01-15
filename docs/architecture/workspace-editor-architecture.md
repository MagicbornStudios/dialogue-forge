# Workspace Editor Architecture Guide

## Overview

This document explains the layered architecture pattern used in Dialogue Forge workspaces, focusing on state management, editor shells, command patterns, and modal management. The architecture separates concerns into distinct layers that communicate through well-defined boundaries.

## Architecture Layers

### Layer Diagram

The workspace architecture consists of four main layers:

1. **Host Application Layer**: Implements data adapters for the workspace
2. **Workspace Layer**: Manages domain state, events, and modals
3. **Editor Instance Layer**: Manages per-instance UI state and bridges to editor libraries
4. **Editor Library Layer**: Third-party libraries (React Flow, Lexical)

### State Ownership

- **Persistent State (Workspace Store)**: Domain data, modal state, panel layout
- **Ephemeral State (Editor Session Store)**: Selection, UI preferences, temporary UI state
- **Library State**: Internal state managed by editor libraries (React Flow nodes, Lexical editor state)

## Core Concepts

### 1. Workspace Store (Domain State)

**Purpose**: Manages persistent domain state that lives across the workspace lifecycle.

**Location**: `src/{domain}/components/{Domain}Workspace/store/{domain}-workspace-store.tsx`

**Characteristics**:
- Uses Zustand with Immer middleware
- Composed of slices (content, gameState, viewState, project)
- Persists across editor instance changes
- Emits events via EventSink
- Contains data adapter reference

**Example**: See `src/forge/components/ForgeWorkspace/store/forge-workspace-store.tsx`

### 2. Editor Session Store (Per-Instance UI State)

**Purpose**: Manages ephemeral UI state specific to a single editor instance.

**Location**: `src/{domain}/components/{Domain}Workspace/components/{Editor}/hooks/use{Editor}Session.tsx`

**Characteristics**:
- Separate Zustand store per editor instance
- Lives only while editor is mounted
- Contains UI preferences (layout direction, toggles, selection)
- Does NOT contain domain data

**Example**: See `src/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeEditorSession.tsx`

**When to Use**:
- Selection state (which node is selected)
- UI toggles (show minimap, auto-organize)
- Editor preferences (layout direction)
- Temporary UI state (context menus, tooltips)

**When NOT to Use**:
- Domain data (graphs, flags, game state) → Use Workspace Store
- Modal state → Use Workspace Store viewState slice
- Persistent preferences → Use Workspace Store

### 3. Editor Shell (Bridge Pattern)

**Purpose**: Bridges editor library (React Flow, Lexical) with domain logic and workspace state.

**Location**: `src/{domain}/components/{Domain}Workspace/components/{Editor}/hooks/use{Editor}Shell.ts`

**Characteristics**:
- Custom hook that wraps editor library
- Handles library events (onNodesChange, onChange, etc.)
- Converts library events to domain mutations
- Provides command dispatch function
- Manages synchronization between library state and domain state

**Example**: See `src/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`

**When to Use Editor Shell**:
- Editor library has complex event system (React Flow, Lexical)
- Need to synchronize library state with domain state
- Editor has multiple interaction modes (drag, select, connect)
- Need command pattern for actions

**When NOT to Use Editor Shell**:
- Simple form inputs → Direct component with workspace store actions
- Static displays → Direct component
- Simple editors with built-in state management that already aligns with domain patterns

### 4. Command Pattern

**Purpose**: Provides typed, testable actions that abstract dispatch logic.

**Location**: 
- Commands: `src/{domain}/components/{Domain}Workspace/components/{Editor}/hooks/{domain}-commands.ts`
- Actions: `src/{domain}/components/{Domain}Workspace/components/{Editor}/hooks/use{Editor}Actions.tsx`

**Example**: See `src/forge/components/ForgeWorkspace/components/GraphEditors/hooks/forge-commands.ts` and `useForgeEditorActions.tsx`

### 5. Modal Management

**Pattern**: Modals are managed in workspace store's viewState slice and rendered by a modal switcher component.

**Implementation**:

1. **Add modal state to viewState slice**: See `src/forge/components/ForgeWorkspace/store/slices/viewState.slice.ts`
2. **Create modal switcher component**: See `src/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeWorkspaceModals.tsx`
3. **Components open modals via workspace actions**: Components call actions like `openYarnModal()` from the workspace store

**Benefits**:
- Single source of truth for modal state
- Easy to test (check store state)
- Consistent pattern across all modals
- Can persist modal state if needed

## Slice Organization

### Slice Principles

1. **Domain Separation**: Each slice owns a distinct domain concern
2. **No Cross-Slice Dependencies**: Slices don't import each other
3. **Shared Types File**: Use `{workspace}-types.ts` to break circular dependencies
4. **Actions Wrapped with Events**: Actions emit events via EventSink

### Recommended Slices

**For Forge Workspace**:
- `graph.slice.ts` - Graph documents and cache
- `gameState.slice.ts` - Flag schema and game state
- `viewState.slice.ts` - UI state (modals, panels, focus)
- `project.slice.ts` - Project selection

**For Writer Workspace**:
- `content.slice.ts` - Acts, chapters, pages
- `editor.slice.ts` - Drafts and save status
- `ai.slice.ts` - AI preview and proposals
- `navigation.slice.ts` - Active page, expanded items
- `viewState.slice.ts` - Modals, panel layout

## Communication Flow

### Data Flow

1. User action triggers component
2. Component calls editor action (via command pattern)
3. Editor shell handles command and updates domain state
4. Workspace store emits event via EventSink
5. Components re-render based on state changes

### State Update Flow

1. User Action → Editor Actions
2. Editor Actions → Editor Shell (dispatch)
3. Editor Shell → Workspace Store (domain update)
4. Editor Shell → Session Store (UI state update)
5. Workspace Store → Event Sink (event emission)
6. State Changes → Components Re-render

## Anti-Patterns

### ❌ Anti-Pattern 1: Domain Data in Session Store

**Wrong**: Putting domain data (like graphs) in the session store.

**Correct**: Session store only contains UI state. Domain data comes from workspace store.

### ❌ Anti-Pattern 2: Direct Callbacks Instead of Actions

**Wrong**: Bypassing the command pattern with direct mutations.

**Correct**: Use typed actions via the command pattern.

### ❌ Anti-Pattern 3: Modal State in Component State

**Wrong**: Managing modal state with `useState` in components.

**Correct**: Modal state lives in workspace store's viewState slice.

### ❌ Anti-Pattern 4: Cross-Slice Imports

**Wrong**: Slices importing each other creates circular dependencies.

**Correct**: Slices are independent. Main store file composes them.

### ❌ Anti-Pattern 5: Editor Shell for Simple Forms

**Wrong**: Over-engineering simple forms with editor shell pattern.

**Correct**: Use direct components for simple forms.

## Decision Tree: When to Use What

```
Is this domain data that persists?
├─ YES → Workspace Store (appropriate slice)
└─ NO → Is this UI state for a specific editor instance?
    ├─ YES → Editor Session Store
    └─ NO → Is this modal state?
        ├─ YES → Workspace Store viewState slice
        └─ NO → Is this a simple form/input?
            ├─ YES → Direct component with workspace actions
            └─ NO → Does editor library have complex events?
                ├─ YES → Editor Shell + Command Pattern
                └─ NO → Direct component
```

## File Structure Reference

```
src/{domain}/
├── components/
│   └── {Domain}Workspace/
│       ├── {Domain}Workspace.tsx  (main component)
│       ├── store/
│       │   ├── {domain}-workspace-store.tsx  (main store)
│       │   ├── {domain}-workspace-types.ts  (shared types)
│       │   └── slices/
│       │       ├── content.slice.ts
│       │       ├── editor.slice.ts
│       │       ├── viewState.slice.ts  (← modals here)
│       │       └── subscriptions.ts
│       ├── components/
│       │   └── {Editor}/
│       │       ├── {Editor}.tsx
│       │       └── hooks/
│       │           ├── use{Editor}Session.tsx  (← session store)
│       │           ├── use{Editor}Shell.ts  (← shell hook)
│       │           ├── {domain}-commands.ts  (← commands)
│       │           └── use{Editor}Actions.tsx  (← actions)
│       └── modals/
│           ├── {Domain}WorkspaceModals.tsx  (← modal switcher)
│           └── components/
│               ├── {Modal}Modal.tsx
│               └── ...
```

## Summary

1. **Workspace Store**: Domain state, persistent, slice-based, emits events
2. **Editor Session Store**: Per-instance UI state, ephemeral, editor-specific
3. **Editor Shell**: Bridge between editor library and domain, handles events, provides dispatch
4. **Command Pattern**: Typed actions via dispatch, testable, consistent
5. **Modal Management**: Workspace store viewState slice + modal switcher component
6. **Slices**: Domain-separated, no cross-dependencies, shared types file

Apply this pattern consistently across Forge, Writer, and AI workspaces for maintainability and clarity.
