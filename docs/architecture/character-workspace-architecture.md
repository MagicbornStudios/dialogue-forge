# Character Workspace Architecture

This document describes the architecture of the Character workspace: its data flow, components, graph implementation, and state management.

---

## Overview

The Character workspace lets users manage **characters** and their **relationship graphs** (POV: point-of-view). For a selected character (the "active character"), the graph shows that character as the center and other characters as nodes, with edges representing relationships (labels and optional "why" descriptions). Data is persisted via a **CharacterWorkspaceAdapter** (e.g. PayloadCMS).

**Important:** The graph is **not** implemented with JointJS. It is a **custom SVG-based** editor (React + SVG). The implementation uses raw SVG with manual drag-and-drop and path rendering. If you want to learn or adopt JointJS, this doc clarifies the current state and suggests a migration path.

---

## Directory Structure

```
packages/characters/src/
├── components/
│   ├── CharacterWorkspace/           # Main workspace
│   │   ├── CharacterWorkspace.tsx    # Container: uses store, project/character load, autosave
│   │   ├── index.ts
│   │   ├── config/
│   │   │   └── editor-config.ts      # Autosave enabled, debounce ms
│   │   ├── hooks/
│   │   │   └── useDebouncedAutosave.ts
│   │   ├── store/                    # Zustand store (used by workspace)
│   │   │   ├── character-workspace-store.tsx
│   │   │   └── slices/
│   │   │       ├── characters.slice.ts
│   │   │       ├── project.slice.ts
│   │   │       ├── viewState.slice.ts
│   │   │       └── subscriptions.ts
│   │   └── components/
│   │       ├── ActiveCharacterPanel.tsx   # Left: active character (lore-book style, editable)
│   │       ├── CharacterDetailsPanel.tsx  # Right: selected node (read-only)
│   │       ├── CharacterSidebar.tsx       # Right: character list + relationships tab
│   │       ├── RelationshipGraphEditor.tsx # Center: SVG graph (nodes + edges)
│   │       ├── RelationshipLabelDialog.tsx
│   │       ├── CharacterWorkspaceToolbar.tsx
│   │       └── ProjectSync.tsx            # Syncs selectedProjectId into store
│   └── RelationshipGraph/
│       └── hooks/
│           └── relationship-commands.ts   # Typed commands for store (optional, for programmatic access)
├── types/
│   ├── character.ts    # RelationshipFlow, nodes, edges, CharacterDoc
│   ├── contracts.ts    # CharacterWorkspaceAdapter, ProjectInfo, CharacterPatch
│   └── index.ts
└── index.ts
```

---

## Data Flow

### High level

1. **Host (e.g. app)** provides:
   - `dataAdapter: CharacterWorkspaceAdapter`
   - `selectedProjectId`, `onProjectChange`
   - Creates and provides `CharacterWorkspaceStore` via `CharacterWorkspaceStoreProvider`
2. **CharacterWorkspace** (container):
   - Uses Zustand store via `useCharacterWorkspaceStore` hooks
   - Loads projects and characters via adapter, updates store
   - Tracks `activeCharacterId` and `currentGraph` in store
   - When project/active character changes, loads or resets graph in store
   - Passes `graph` and `onGraphChange(actions.setActiveGraphFlow)` to the graph editor
   - **Autosave:** `useDebouncedAutosave(currentGraph, activeCharacterId, dataAdapter, config)` debounces graph changes and calls `dataAdapter.updateCharacter(activeCharacterId, { relationshipFlow })`, then updates store with `actions.upsertCharacter(updated)`
3. **RelationshipGraphEditor**:
   - Receives `graph`, `onGraphChange`, `characters`, `activeCharacterId`, etc.
   - Renders SVG nodes and edges; handles drag-from-sidebar, node drag, add/remove node, add/remove/edit edge
   - All mutations go through `onGraphChange(newGraph)` (immutable updates) which calls store action

### State ownership

| State              | Owner                | Notes                                      |
|--------------------|----------------------|--------------------------------------------|
| Projects list      | Store (ProjectSlice) | From `dataAdapter.listProjects()`          |
| Characters list    | Store (CharactersSlice) | From `dataAdapter.listCharacters(project)`|
| Active character  | Store (CharactersSlice) | Selected POV for the graph                 |
| Current graph     | Store (CharactersSlice) | `RelationshipFlow` on active character     |
| Selected node     | RelationshipGraphEditor | Which node is selected (for details panel) |
| UI (dialogs, etc.)| Various components  | Local useState                             |

---

## Store Architecture

The workspace uses **Zustand** with **Immer** middleware for state management. The store is composed of three slices:

### ProjectSlice
- `activeProjectId: string | null`
- `projects: ProjectInfo[]`
- Actions: `setActiveProjectId`, `setProjects`

### CharactersSlice
- `charactersById: Record<string, CharacterDoc>`
- `activeCharacterId: string | null`
- Actions:
  - CRUD: `setCharacters`, `setActiveCharacterId`, `upsertCharacter`, `removeCharacter`, `updateCharacterField`
  - Graph mutations: `addNodeToActiveGraph`, `moveNodeInActiveGraph`, `removeNodeFromActiveGraph`, `addEdgeToActiveGraph`, `updateEdgeLabelInActiveGraph`, `removeEdgeFromActiveGraph`, `setActiveGraphFlow`

### ViewStateSlice
- `toolMode: ToolMode`
- `sidebarSearchQuery: string`
- `showLabels: boolean`
- `selectedCharacterId: string | null`
- Actions: `setToolMode`, `setSidebarSearchQuery`, `setShowLabels`, `setSelectedCharacterId`

**Store Provider:** The host app creates a store instance and wraps `CharacterWorkspace` with `CharacterWorkspaceStoreProvider`.

---

## Graph Model (Custom SVG, Not JointJS)

The graph is a plain data structure: **RelationshipFlow** = `{ nodes, edges }`.

- **RelationshipFlowNode:** `id` (characterId), `type: 'character'`, `position: { x, y }`, optional `data`.
- **RelationshipFlowEdge:** `id` (`source->target`), `source`, `target`, `type: 'relationship'`, optional `data: { label?, why? }`.

Stored on the character document as `character.relationshipFlow`. The editor does **not** use JointJS `dia.Graph` or `dia.Paper`; it uses:

- One **SVG** element.
- **Nodes:** `<g>` with `transform={translate(x,y)}`, circle + text + buttons.
- **Edges:** `<path>` with quadratic bezier (control point) and arrow markers.
- **Drag:** `mousedown` → `mousemove` / `mouseup` on window; `onGraphChange` with updated node positions.
- **Drop from sidebar:** HTML5 drag-and-drop; `dataTransfer.getData('application/character')`; then `handleAddCharacter(id, position)`.

The implementation is custom SVG + React, not JointJS.

---

## Key Components

### CharacterWorkspace.tsx

- Uses Zustand store via `useCharacterWorkspaceStore` hooks
- Renders toolbar (project switcher, create character, counts, Admin/API)
- Loads projects/characters with `useEffect`; updates store via actions
- Derives graph for active character from store (`charactersById[activeCharacterId]?.relationshipFlow`)
- Renders `RelationshipGraphEditor` with `graph={currentGraph}`, `onGraphChange={actions.setActiveGraphFlow}`
- Autosave via `useDebouncedAutosave`; updates store after successful save
- Includes `ProjectSync` component to sync `selectedProjectId` prop to store

### RelationshipGraphEditor.tsx

- **Left:** ActiveCharacterPanel (active character details, edit on hover)
- **Center:** Scrollable area with grid background + SVG: edges then nodes; drop zone for sidebar drag; node drag, select, context menu ("Load as Active Character"), add relationship, remove node
- **Right:** CharacterSidebar (characters + relationships tabs) and CharacterDetailsPanel (selected node)
- **Dialogs:** RelationshipLabelDialog (label + description for edge)

Handlers: `handleAddCharacter`, `handleRemoveNode`, `handleAddRelationship`, `handleUpdateEdgeLabel`, `handleRemoveEdge`, node drag via `onGraphChange` with updated positions.

### Adapter (contracts)

**CharacterWorkspaceAdapter** (in `types/contracts.ts`): `listProjects`, `listCharacters(projectId)`, `createCharacter`, `updateCharacter`, `uploadMedia`. Optional: `deleteCharacter`. The host (e.g. app) implements this; the workspace never imports Payload types.

---

## Editor Config

`config/editor-config.ts`:

- **CharacterGraphEditorConfig:** `autosaveEnabled`, `autosaveDebounceMs`
- **DEFAULT_EDITOR_CONFIG:** autosave on, 2000 ms debounce

Used only by `useDebouncedAutosave` in CharacterWorkspace.

---

## Autosave Flow

1. User edits graph (drag node, add edge, etc.)
2. `onGraphChange` called → `actions.setActiveGraphFlow(newGraph)` → store updated
3. `useDebouncedAutosave` hook detects graph change (compares serialized JSON)
4. Waits `autosaveDebounceMs` (2 seconds default)
5. If no further changes, calls `dataAdapter.updateCharacter(activeCharacterId, { relationshipFlow })`
6. On success, calls `onSaveComplete` callback → `actions.upsertCharacter(updated)` to sync store with server state
7. On error, logs error and doesn't update `lastSavedGraphRef`, so it will retry on next change

---

## RelationshipCommands (Optional)

`RelationshipGraph/hooks/relationship-commands.ts` provides typed commands for programmatic access to the store (e.g., for AI agents or non-React code). The UI doesn't use these directly; it uses store actions via hooks. These commands are useful for:
- AI agents that need to manipulate the graph
- External tools that interact with the workspace
- Testing and automation

---

## JointJS: Current vs Possible Future

- **Current:** Custom SVG graph; no JointJS dependency. Good for learning the domain (nodes, edges, positions, persistence) without another library.
- **If you want to learn JointJS:** You can add it as a dependency and replace the SVG block in `RelationshipGraphEditor` with a JointJS `dia.Paper` + `dia.Graph`, and:
  - Map `RelationshipFlow` ↔ JointJS cells (elements + links)
  - Keep the same adapter and `RelationshipFlow` type; use JointJS only for rendering and interaction (drag, link creation, etc.), then sync back to `RelationshipFlow` and `onGraphChange`
- **If you keep the custom SVG:** The codebase now correctly names it as "relationship graph" or "SVG graph" (no JointJS references).

---

## File Roles (Quick Reference)

| File / folder           | Role |
|-------------------------|------|
| `CharacterWorkspace.tsx` | Container, uses store, project/character loading, autosave wiring |
| `RelationshipGraphEditor.tsx` | SVG graph, drag/drop, nodes/edges, panels layout |
| `ActiveCharacterPanel.tsx` | Active character (lore-book style), edit on hover |
| `CharacterSidebar.tsx`  | Character list + relationships tab, drag source |
| `CharacterDetailsPanel.tsx` | Selected node details (read-only) |
| `RelationshipLabelDialog.tsx` | Edit edge label + description |
| `useDebouncedAutosave.ts` | Debounce graph → `updateCharacter(relationshipFlow)` |
| `config/editor-config.ts` | Autosave and debounce settings |
| `store/character-workspace-store.tsx` | Zustand store creation and provider |
| `store/slices/*.ts` | Store slices (project, characters, viewState) |
| `types/character.ts`     | RelationshipFlow, nodes, edges, CharacterDoc |
| `types/contracts.ts`     | CharacterWorkspaceAdapter, ProjectInfo, CharacterPatch |
| `RelationshipGraph/hooks/relationship-commands.ts` | Typed commands for programmatic store access |

---

## Summary

- **Architecture:** Host provides adapter and project id, creates Zustand store; CharacterWorkspace uses store for all state, uses debounced autosave, and passes graph + `onGraphChange` (store action) to a custom SVG-based graph editor.
- **Graph:** Implemented with React + SVG, not JointJS; relationship data is `RelationshipFlow` stored on the character document.
- **State Management:** Zustand store with Immer middleware; three slices (project, characters, viewState); all UI uses store hooks.
- **Autosave:** Debounced (2s default), saves to adapter, then updates store with server response.

