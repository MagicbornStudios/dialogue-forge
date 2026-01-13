---
name: Narrative Editor Refactor - Unified Flow Editor Pattern (Cursor Plan)
overview: Refactor ForgeNarrativeGraphEditor to be architecturally identical to ForgeStoryletGraphEditor. Remove pool concept, remove forge-adapter.ts, add optional ForgeUIBridge. PR-by-PR structure with strong scan step.
todos: []
---

# Narrative Editor Refactor — Unified Flow Editor Pattern (Cursor Plan)

## Overview

Refactor `ForgeNarrativeGraphEditor` to be architecturally identical to `ForgeStoryletGraphEditor`:

- Same shell (`useForgeFlowEditorShell`)
- Same dispatch/commands system
- Same actions façade
- Same session store pattern (per editor instance)
- **No narrative-specific editor logic** — narrative is just a different set of node types and menu constraints
- **No "pool" concept** (remove any leftover constants/components/slices)
- **No `forge-adapter.ts`** — only `ForgeDataAdapter` exists as the package integration surface
- Optional **ForgeUIBridge** (Forge-owned) for UI orchestration, if needed (not a host-provided interface)

## Important Ownership Clarifications

- **Host app**: Next.js PayloadCMS app that mounts Forge (e.g. `app/(route)/page.tsx`). It implements `ForgeDataAdapter` (already done: `makePayloadForgeAdapter`).
- **ForgeWorkspace**: highest-level component inside the Forge package. It orchestrates editors, stores, saving, etc.
- Editors do not import host app code. Editors may import Forge stores and/or a Forge-owned UI facade.

## Target Architecture

```mermaid
flowchart TB
  subgraph "Host App (Next.js PayloadCMS app)"
    Page[page.tsx]
    DataImpl[makePayloadForgeAdapter()<br/>implements ForgeDataAdapter]
  end

  subgraph "Forge Package"
    subgraph "ForgeWorkspace"
      DataAdapter[ForgeDataAdapter<br/>persistence]
      Cache[Zustand Stores<br/>graph cache, flags, UI state]
      UIBridge[ForgeUIBridge (optional)<br/>typed facade over Forge UI actions]
    end

    subgraph "Editor Instance (Storylet or Narrative)"
      SessionStore[Session Store<br/>Per editor instance]
      Shell[useForgeFlowEditorShell<br/>Graph operations]
      Dispatch[dispatch(cmd)<br/>Command handler]
      Actions[Actions façade<br/>graph + session ops]
    end
  end

  subgraph "React Flow"
    Node[Node Component]
    Edge[Edge Component]
    Menus[EdgeDropMenus / PaneMenus]
  end

  Page -->|provides| DataImpl
  DataImpl -->|passed into| ForgeWorkspace

  ForgeWorkspace --> DataAdapter
  ForgeWorkspace --> Cache
  ForgeWorkspace --> UIBridge

  Editor --> SessionStore
  Editor --> Shell
  Shell --> Dispatch
  Shell --> Actions

  Node -->|graph ops| Actions
  Edge -->|graph ops| Actions
  Menus -->|graph ops| Actions

  Node -->|ui ops (optional)| UIBridge
  Edge -->|ui ops (optional)| UIBridge

  Shell -->|onChange graph| ForgeWorkspace
  ForgeWorkspace -->|persist| DataAdapter
```

## Implementation Plan (PR-by-PR, Working-State Focus)

### PR0 — Re-Scan + Pool Removals Inventory (No Behavior Change)

**Goal:** Cursor produces a high-confidence map of what's real and what's dead, especially edge drop menus and pool remnants.

#### 0.1 Search Targets (must be exhaustive)

Cursor: run a repo-wide scan for the following tokens and list every file that matches:

**Legacy Narrative / Thread:**

- `StoryThread`
- `NARRATIVE_ELEMENT`
- `NarrativeFlowNodeData`
- `convertNarrativeToReactFlow`
- `convertReactFlowToNarrative`
- `useNarrativePathHighlighting`
- `narrative-converter`
- `narrative-helpers`
- `addAct`
- `addChapter`
- `addPage`

**Pool Remnants (must be removed):**

- `POOL`
- `STORYLET_POOL`
- `StoryletPool`
- `poolId`
- `poolGraph`
- `activePool`
- `PoolNode`
- `PoolEdge`
- `pool.slice`
- `PoolSection`
- `PoolGraphSection`

**Edge Drop Menu / Context Menu Plumbing:**

- `EdgeDropMenu`
- `edgeDropMenu`
- `setEdgeDropMenu`
- `onAddNode`
- `onAddElement`
- `insertNodeOnEdge`
- `sourceHandle`
- `fromChoiceIdx`
- `fromBlockIdx`
- `ContextMenuBase`
- `@/components/ui/context-menu` (shadcn)
- `ContextMenuItem`

**Graph Persistence + Cache:**

- `ForgeDataAdapter`
- `listGraphs`
- `getGraph`
- `updateGraph`
- `createGraph`
- `compiledYarn`
- `ForgeGraphDoc`
- `ForgeFlowJson`
- `setDialogue` / `dialogue.slice` (if present)
- `graph.slice` (if present)

**Deliverable from Cursor:**

- A table of `token -> matching files`
- A "dead code candidate" list (files that appear unused)
- A "must change for narrative refactor" list

#### 0.2 Confirm Current Runtime Paths (what is actually used)

Cursor must identify:

- Which EdgeDropMenu implementation is actually rendered today (if any)
- Where `edgeDropMenu` state currently lives (local component state vs zustand store vs session)
- How Storylet editor currently wires node callbacks ("callback soup")
- How Narrative editor currently builds nodes/edges (converter path) and how it persists

**Tasks:**

- Run the Updated Codebase Scan (0.1 + 0.2)
- Output:
  - List of pool remnants to delete (files + identifiers)
  - List of edge drop menu files and which are actually used
  - List of narrative legacy dependencies and where they route
- No refactor yet

**Done When:**

- We have an accurate "hit list" for PR1+ and can delete pool safely

---

### PR1 — Per-Editor Session Store (Selection + Menus + Layout)

**Goal:** Storylet + Narrative editors can be open simultaneously without state bleed.

**New file:**

- `src/components/GraphEditors/hooks/useForgeEditorSession.ts`

**State must include:**

- `selectedNodeId: string | null`
- `paneContextMenu: { x: number; y: number; graphX: number; graphY: number } | null`
- `edgeDropMenu: EdgeDropMenuState | null` (must support both dialogue-style and narrative-style needs)
- `layoutDirection: LayoutDirection`
- `autoOrganize: boolean`
- `showPathHighlight: boolean`
- `showBackEdges: boolean`

**Update:**

- `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`
  - Remove local state for the above
  - Accept `sessionStore: ForgeEditorSessionStore`

**Implementation:**

```typescript
// src/components/GraphEditors/hooks/useForgeEditorSession.ts
import { createContext, useContext } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { LayoutDirection } from '@/src/utils/forge-flow-helpers';

export type EdgeDropMenuState = {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  sourceHandle?: string;
  fromChoiceIdx?: number;
  fromBlockIdx?: number;
} | null;

export interface ForgeEditorSessionState {
  selectedNodeId: string | null;
  paneContextMenu: { x: number; y: number; graphX: number; graphY: number } | null;
  edgeDropMenu: EdgeDropMenuState;
  layoutDirection: LayoutDirection;
  autoOrganize: boolean;
  showPathHighlight: boolean;
  showBackEdges: boolean;
}

export function createForgeEditorSessionStore(initialState?: Partial<ForgeEditorSessionState>) {
  return createStore<ForgeEditorSessionState>()((set) => ({
    selectedNodeId: null,
    paneContextMenu: null,
    edgeDropMenu: null,
    layoutDirection: 'TB',
    autoOrganize: false,
    showPathHighlight: true,
    showBackEdges: true,
    ...initialState,
  }));
}

export type ForgeEditorSessionStore = ReturnType<typeof createForgeEditorSessionStore>;

const ForgeEditorSessionContext = createContext<ForgeEditorSessionStore | null>(null);

export function ForgeEditorSessionProvider({
  store,
  children,
}: {
  store: ForgeEditorSessionStore;
  children: React.ReactNode;
}) {
  return (
    <ForgeEditorSessionContext.Provider value={store}>
      {children}
    </ForgeEditorSessionContext.Provider>
  );
}

export function useForgeEditorSession<T>(
  selector: (state: ForgeEditorSessionState) => T
): T {
  const store = useContext(ForgeEditorSessionContext);
  if (!store) {
    throw new Error('useForgeEditorSession must be used within ForgeEditorSessionProvider');
  }
  return useStore(store, selector);
}
```

**Done When:**

- Storylet editor uses session store and still works
- Two open editors do not leak selection/menu state

---

### PR2 — Commands + Dispatch + Actions (Single System)

**Goal:** One command system shared by Storylet and Narrative editors. This is the backbone.

**New files:**

- `src/components/GraphEditors/hooks/forge-commands.ts`
- `src/components/GraphEditors/hooks/useForgeEditorActions.ts`
- `src/components/GraphEditors/hooks/ForgeEditorActionsProvider.tsx`

**Update:**

- `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`
  - Add `dispatch(cmd)` that:
    - mutates session store for UI-ish events (select, open menus)
    - mutates graph flow for graph ops (create node, delete node, create edge, delete edge, insert on edge)
  - Return `dispatch` from shell

**Implementation:**

```typescript
// src/components/GraphEditors/hooks/forge-commands.ts
import type { ForgeNodeType, ForgeNode } from '@/src/types/forge/forge-graph';
import type { Connection } from 'reactflow';
import type { EdgeDropMenuState } from './useForgeEditorSession';

export const FORGE_COMMAND = {
  UI: {
    SELECT_NODE: 'UI.SELECT_NODE',
    OPEN_NODE_EDITOR: 'UI.OPEN_NODE_EDITOR',
    SET_PANE_CONTEXT_MENU: 'UI.SET_PANE_CONTEXT_MENU',
    CLEAR_PANE_CONTEXT_MENU: 'UI.CLEAR_PANE_CONTEXT_MENU',
    SET_EDGE_DROP_MENU: 'UI.SET_EDGE_DROP_MENU',
    CLEAR_EDGE_DROP_MENU: 'UI.CLEAR_EDGE_DROP_MENU',
  },
  GRAPH: {
    NODE_CREATE: 'GRAPH.NODE_CREATE',
    NODE_PATCH: 'GRAPH.NODE_PATCH',
    NODE_DELETE: 'GRAPH.NODE_DELETE',
    NODE_INSERT_ON_EDGE: 'GRAPH.NODE_INSERT_ON_EDGE',
    EDGE_DELETE: 'GRAPH.EDGE_DELETE',
    EDGE_CREATE: 'GRAPH.EDGE_CREATE',
  },
} as const;

export type ForgeCommand =
  | { type: typeof FORGE_COMMAND.UI.SELECT_NODE; nodeId: string }
  | { type: typeof FORGE_COMMAND.UI.OPEN_NODE_EDITOR; nodeId: string }
  | { type: typeof FORGE_COMMAND.UI.SET_PANE_CONTEXT_MENU; menu: { x: number; y: number; graphX: number; graphY: number } }
  | { type: typeof FORGE_COMMAND.UI.CLEAR_PANE_CONTEXT_MENU }
  | { type: typeof FORGE_COMMAND.UI.SET_EDGE_DROP_MENU; menu: EdgeDropMenuState }
  | { type: typeof FORGE_COMMAND.UI.CLEAR_EDGE_DROP_MENU }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_CREATE; nodeType: ForgeNodeType; x: number; y: number; autoConnect?: { fromNodeId: string; sourceHandle?: string } }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_PATCH; nodeId: string; updates: Partial<ForgeNode> }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_DELETE; nodeId: string }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_INSERT_ON_EDGE; edgeId: string; nodeType: ForgeNodeType; x: number; y: number }
  | { type: typeof FORGE_COMMAND.GRAPH.EDGE_DELETE; edgeId: string }
  | { type: typeof FORGE_COMMAND.GRAPH.EDGE_CREATE; connection: Connection };
```
```typescript
// src/components/GraphEditors/hooks/useForgeEditorActions.ts
import { createContext, useContext } from 'react';
import type { ForgeCommand } from './forge-commands';
import { FORGE_COMMAND } from './forge-commands';
import type { ForgeNodeType, ForgeNode } from '@/src/types/forge/forge-graph';
import type { Connection } from 'reactflow';

export interface ForgeEditorActions {
  selectNode: (nodeId: string) => void;
  openNodeEditor: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  patchNode: (nodeId: string, updates: Partial<ForgeNode>) => void;
  createNode: (nodeType: ForgeNodeType, x: number, y: number, autoConnect?: { fromNodeId: string; sourceHandle?: string }) => void;
  insertNodeOnEdge: (edgeId: string, nodeType: ForgeNodeType, x: number, y: number) => void;
  deleteEdge: (edgeId: string) => void;
  createEdge: (connection: Connection) => void;
}

export function makeForgeEditorActions(dispatch: (cmd: ForgeCommand) => void): ForgeEditorActions {
  return {
    selectNode: (nodeId: string) => dispatch({ type: FORGE_COMMAND.UI.SELECT_NODE, nodeId }),
    openNodeEditor: (nodeId: string) => dispatch({ type: FORGE_COMMAND.UI.OPEN_NODE_EDITOR, nodeId }),
    deleteNode: (nodeId: string) => dispatch({ type: FORGE_COMMAND.GRAPH.NODE_DELETE, nodeId }),
    patchNode: (nodeId: string, updates: Partial<ForgeNode>) => dispatch({ type: FORGE_COMMAND.GRAPH.NODE_PATCH, nodeId, updates }),
    createNode: (nodeType: ForgeNodeType, x: number, y: number, autoConnect?: { fromNodeId: string; sourceHandle?: string }) =>
      dispatch({ type: FORGE_COMMAND.GRAPH.NODE_CREATE, nodeType, x, y, autoConnect }),
    insertNodeOnEdge: (edgeId: string, nodeType: ForgeNodeType, x: number, y: number) =>
      dispatch({ type: FORGE_COMMAND.GRAPH.NODE_INSERT_ON_EDGE, edgeId, nodeType, x, y }),
    deleteEdge: (edgeId: string) => dispatch({ type: FORGE_COMMAND.GRAPH.EDGE_DELETE, edgeId }),
    createEdge: (connection: Connection) => dispatch({ type: FORGE_COMMAND.GRAPH.EDGE_CREATE, connection }),
  };
}

const ForgeEditorActionsContext = createContext<ForgeEditorActions | null>(null);

export function ForgeEditorActionsProvider({
  actions,
  children,
}: {
  actions: ForgeEditorActions;
  children: React.ReactNode;
}) {
  return (
    <ForgeEditorActionsContext.Provider value={actions}>
      {children}
    </ForgeEditorActionsContext.Provider>
  );
}

export function useForgeEditorActions(): ForgeEditorActions {
  const actions = useContext(ForgeEditorActionsContext);
  if (!actions) {
    throw new Error('useForgeEditorActions must be used within ForgeEditorActionsProvider');
  }
  return actions;
}
```

**Done When:**

- Storylet editor can function using actions/dispatch (even if callbacks remain temporarily)
- Shell is the single "graph truth" mutation surface

---

### PR3 — Storylet Editor Cleanup (Remove Callback Soup)

**Goal:** Nodes/edges should not receive closures via `data`. They should use actions + session.

**Update:**

- `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`
  - `ShellNodeData` must contain *only data*, no functions:
    ```typescript
    export type ShellNodeData = {
      node: ForgeNode;
      layoutDirection?: LayoutDirection;
      ui: {
        isDimmed?: boolean;
        isInPath?: boolean;
        isStartNode?: boolean;
        isEndNode?: boolean;
      };
      // Read-only flags only
      hasConditionals?: boolean; // Data, not callback
      // NO callbacks: onEdit, onDelete, onAddChoice, onAddConditionals
    };
    ```


**Update Storylet files:**

- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`
  - Remove `callbacks: Partial<ShellNodeData>` and `edgeCallbacks`
- Update Storylet node/edge components to:
  - call `useForgeEditorActions()` for graph ops
  - open menus by dispatching to session (`SET_EDGE_DROP_MENU`, etc.)

**Files to update:**

- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/CharacterNode.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/PlayerNodeV2.tsx`
- `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNode.tsx`
- `src/components/GraphEditors/shared/Nodes/DetourNode/DetourNode.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/ChoiceEdgeV2.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/CharacterEdge.tsx`

**Example:**

```typescript
// OLD
<ContextMenuItem onSelect={data.onDelete}>
  Delete
</ContextMenuItem>

// NEW
const actions = useForgeEditorActions();
<ContextMenuItem onSelect={() => actions.deleteNode(node.id!)}>
  Delete
</ContextMenuItem>
```

**Done When:**

- Storylet graph works identical to today
- Node `data` contains no function props

---

### PR4 — EdgeDropMenus: Keep Them Clearly Defined, Make Them Actually Used

**Goal:** Keep your **per-node-folder EdgeDropMenu** pattern, but make it real and consistent.

**Rules:**

- EdgeDropMenus are rendered by the **editor layer**, not embedded ad-hoc and not passed callbacks
- Each EdgeDropMenu component should receive:
  - coordinates
  - `fromNodeId`
  - `sourceHandle?`
  - whatever indices apply (choice/block) **only if that node type needs them**
  - and it should call actions (`createNode` or `insertNodeOnEdge`) directly

**Implementation:**

- Create a registry map in each editor:
  - `storyletEdgeDropMenuByNodeType`
  - `narrativeEdgeDropMenuByNodeType`
- Editor reads `session.edgeDropMenu` and chooses which menu to render based on `fromNodeType`

**Files to verify/update:**

- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/CharacterEdgeDropMenu.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/PlayerEdgeDropMenu.tsx`
- `src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalEdgeDropMenu.tsx`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletEdgeDropMenu.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/*/ActEdgeDropMenu.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/*/ChapterEdgeDropMenu.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/*/PageEdgeDropMenu.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/*/ThreadEdgeDropMenu.tsx`

**Important:**

- Remove any "mode: narrative/dialogue" union `EdgeDropMenu` if it isn't truly used
- Keep `ContextMenuBase` approach if it's working; shadcn context menus are optional

**Example registry:**

```typescript
// In ForgeStoryletGraphEditor.tsx
import { CharacterEdgeDropMenu } from './components/NPCNode/CharacterEdgeDropMenu';
import { PlayerEdgeDropMenu } from './components/PlayerNode/PlayerEdgeDropMenu';
// ...

const storyletEdgeDropMenuByNodeType: Record<string, React.ComponentType<any>> = {
  [FORGE_NODE_TYPE.CHARACTER]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.PLAYER]: PlayerEdgeDropMenu,
  // ...
};

// In render:
const edgeDropMenu = useForgeEditorSession(s => s.edgeDropMenu);
if (edgeDropMenu) {
  const MenuComponent = storyletEdgeDropMenuByNodeType[sourceNodeType];
  if (MenuComponent) {
    return <MenuComponent {...edgeDropMenu} />;
  }
}
```

**Done When:**

- Edge drop menus appear reliably for storylet editor
- The menus used are the ones in the per-node folders (not dead code)
- Narrative can reuse the same rendering contract later

---

### PR5 — Narrative Editor Rewrite (No Converter, No StoryThread)

**Goal:** Narrative editor becomes a ForgeGraphDoc editor, identical architecture to storylet.

**Replace props:**

- `thread: StoryThread` → `graph: ForgeGraphDoc | null`
- `onChange(thread)` → `onChange(graph)`

**Remove:**

- `convertNarrativeToReactFlow`
- `convertReactFlowToNarrative`
- `StoryThread` usage
- `NARRATIVE_ELEMENT` in editor logic

**Update nodeTypes:**

- Use `FORGE_NODE_TYPE` constants:
  - `ACT`, `CHAPTER`, `PAGE`, `CONDITIONAL`, `DETOUR`, and optionally `STORYLET` if narrative links to storylets

**Update narrative nodes:**

- Use `ShellNodeData`
- Use actions for mutations
- Use session for menus

**Files to update:**

- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx` - Complete rewrite
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/ThreadNode/ThreadNode.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/ActNode/ActNode.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/ChapterNode/ChapterNode.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/PageNode/PageNode.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/NarrativeGraphEditorPaneContextMenu.tsx`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts` - Delete, use `useFlowPathHighlighting`

**Key changes:**

1. Replace `NarrativeFlowNodeData` with `ShellNodeData`
2. Access node data via `data.node: ForgeNode`
3. Use actions instead of callbacks
4. Remove narrative-specific callbacks: `onAddAct`, `onAddChapter`, `onAddPage`, `onEditDialogue`, `canAddChapter`, `canAddAct`

**Done When:**

- Narrative editor works: create nodes, connect, delete nodes/edges, edge insert works
- No converter invoked anywhere

---

### PR6 — ForgeWorkspace Integration (Graph Load/Save via ForgeDataAdapter)

**Goal:** Narrative + Storylet graphs load/save correctly via the existing adapter interface.

**Update:**

- `src/components/ForgeWorkspace/ForgeWorkspace.tsx`
  - Accept `dataAdapter: ForgeDataAdapter` (if it doesn't already)
  - Manage debounced persistence through `dataAdapter.updateGraph`
  - Cache graphs in store slice (rename optional later)

**Update:**

- `src/components/ForgeWorkspace/components/NarrativeGraphSection.tsx`
  - Pass `ForgeGraphDoc` instead of thread

**Implementation:**

```typescript
// In ForgeWorkspace.tsx
interface ForgeWorkspaceProps {
  // ... existing props
  dataAdapter: ForgeDataAdapter; // Add this
}

// Handle graph changes with debouncing
const handleNarrativeGraphChange = useCallback(async (graph: ForgeGraphDoc) => {
  // Update cache
  setDialogue(graph.id.toString(), graph);
  
  // Save via adapter (debounced)
  if (dataAdapter) {
    await dataAdapter.updateGraph(graph.id, {
      flow: graph.flow,
      startNodeId: graph.startNodeId,
      endNodeIds: graph.endNodeIds,
    });
  }
}, [dataAdapter, setDialogue]);
```

**Done When:**

- Narrative graph persists to Payload
- Storylet graph persists to Payload
- No narrative thread state remains

---

### PR7 — Remove Pool Remnants + Legacy Narrative Code + Dead Menus

**Goal:** Delete all leftovers safely.

**Delete / Remove:**

- Any `POOL` / `STORYLET_POOL` constants, nodes, slices, components
- `src/utils/narrative-converter.ts` (or move to `legacy/` only if required)
- `useNarrativePathHighlighting.ts` if thread-based
- dead edge drop menus not used anymore

**Files to check for deletion:**

- Any files matching pool-related search terms from PR0
- `src/utils/narrative-converter.ts`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts` (if thread-based)

**Done When:**

- Grep for pool tokens returns nothing meaningful
- Grep for `StoryThread` / `NARRATIVE_ELEMENT` returns nothing in editor stack

---

## Definition of Done

1. ✅ Narrative editor contains **no** `StoryThread`, no converter, no `NARRATIVE_ELEMENT`
2. ✅ Both editors use the same shell + dispatch + actions
3. ✅ Node/edge `data` contains **no function callbacks**
4. ✅ Two editor instances can be open without state bleed (session per instance)
5. ✅ EdgeDropMenus are **clearly defined per node folder** and are actually used
6. ✅ Graph persistence goes through `ForgeDataAdapter` (`updateGraph`, etc.)
7. ✅ No pool concept exists anywhere

---

## Notes / Decisions Locked

- Data adapter is already real and stays: `ForgeDataAdapter` and host implementation `makePayloadForgeAdapter`
- We are **not** adding `forge-adapter.ts`
- If a UI abstraction is needed, it is a Forge-owned **ForgeUIBridge** (optional), implemented inside the Forge package and backed by existing stores. It is **not** host-provided, and it introduces **no new source of truth**
- EdgeDropMenus follow per-node-folder pattern, rendered by editor layer
- Session stores are per-editor-instance
- Commands are dot-accessible constants (`FORGE_COMMAND.UI.SELECT_NODE`)

---

## File Change Summary

### New Files

- `src/components/GraphEditors/hooks/useForgeEditorSession.ts` - Session store
- `src/components/GraphEditors/hooks/forge-commands.ts` - Command constants and types
- `src/components/GraphEditors/hooks/useForgeEditorActions.ts` - Actions façade
- `src/components/GraphEditors/hooks/ForgeEditorActionsProvider.tsx` - Actions context

### Modified Files

- `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts` - Add dispatch, use session store, remove callbacks from ShellNodeData
- `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx` - Remove callback soup, use actions
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/**/*.tsx` - Use actions instead of callbacks
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx` - Complete rewrite
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/components/**/*.tsx` - Update to use ShellNodeData and actions
- `src/components/ForgeWorkspace/components/NarrativeGraphSection.tsx` - Pass ForgeGraphDoc instead of StoryThread
- `src/components/ForgeWorkspace/ForgeWorkspace.tsx` - Add dataAdapter, update graph loading/saving

### Deleted Files (PR7)

- `src/utils/narrative-converter.ts` - Legacy converter (or move to legacy/)
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts` - Use shared hook instead
- Any pool-related files identified in PR0 scan

---

## Key Principles

1. **Narrative is not special** - Same mechanics as storylet, just different node types
2. **No callback soup** - Actions and session replace all callbacks
3. **Session per instance** - Each editor has its own session store
4. **ForgeUIBridge is optional** - Forge-owned, not host-provided
5. **ForgeDataAdapter for persistence** - All save/load goes through adapter
6. **ForgeGraphDoc.flow everywhere** - No converters, no StoryThread in editor
7. **Dispatch for commands** - Single command system for both editors
8. **EdgeDropMenus per node folder** - Clearly defined, rendered by editor layer
9. **No pool concept** - Remove all pool-related code