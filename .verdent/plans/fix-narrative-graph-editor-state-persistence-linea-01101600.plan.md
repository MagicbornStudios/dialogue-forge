# Fix Narrative Graph Editor

## Objective

Address critical bugs (nodes disappearing, state not persisting) and implement requested features (page context menu options, edit dialogue functionality, enhanced path highlighting).

---

## Issue Analysis

### Bug 1: Nodes Disappear After Adding

**Root Cause:** Race condition in state synchronization. The `useEffect` that syncs the `thread` prop depends on multiple variables (`selectedElementId`, `showPathHighlight`, `nodeDepths`, `edgesToSelectedElement`). When ANY of these change (e.g., user clicks elsewhere), the effect runs. By then, `localUpdateRef.current` may already be cleared, causing the old `thread` prop to overwrite local state.

**Fix:** Implement a more robust state guard using a timestamp or counter instead of a simple ref flag.

### Bug 2: Chapter-to-Chapter Connections Shown

**Root Cause:** The converter was modified to add sequential dashed edges between chapters and acts, but this creates unwanted visual connections.

**Fix:** Remove the sequential dashed edges - the linear structure is already expressed by the order of elements.

### Bug 3: Missing Dependency in handleAddElement

**Root Cause:** `layoutDirection` is missing from the useCallback dependencies, causing stale closures.

---

## Implementation Plan

### Step 1: Fix State Synchronization Race Condition

**File:** `src/components/NarrativeGraphEditor/NarrativeGraphEditor.tsx`

**Changes:**

1. Replace `localUpdateRef` with a version counter pattern:

   ```typescript
   const localVersionRef = useRef(0);
   const lastSyncedVersionRef = useRef(0);
   ```
2. Increment `localVersionRef.current` on every local mutation
3. In the sync effect, compare versions to decide whether to skip
4. Only sync from prop when `lastSyncedVersionRef.current >= localVersionRef.current`

### Step 2: Remove Sequential Edges (Chapter→Chapter, Act→Act)

**File:** `src/utils/narrative-converter.ts`

**Changes:**

- Remove the loops at lines 232-258 that add `act-act-*` and `chapter-chapter-*` edges
- The linear structure is already implicit in the nested hierarchy

### Step 3: Update Page Context Menu

**File:** `src/components/NarrativeGraphEditor/components/PageNode/PageNodeContextMenu.tsx`

**Current Options:** Edit Page, Delete, Cancel

**New Options:**

- **Add Page** - Add next page in sequence
- **Add Chapter** - Add new chapter (after current)
- **Add Act** - Add new act (after current)
- **Edit Dialogue** - Open dialogue tree in DialogueGraphEditor
- **Delete**
- Cancel

**Props to Add:**

```typescript
interface PageNodeContextMenuProps {
  // existing...
  onAddPage: () => void;
  onAddChapter: () => void;
  onAddAct: () => void;
  onEditDialogue: () => void;
}
```

### Step 4: Update Page Edge Drop Menu

**File:** `src/components/NarrativeGraphEditor/components/PageNode/PageEdgeDropMenu.tsx`

**Current Options:** Add Page only

**New Options:**

- Add Page
- Add Chapter
- Add Act

**Changes:**

```typescript
const availableElementTypes: NarrativeElement[] = [
  NARRATIVE_ELEMENT.PAGE,
  NARRATIVE_ELEMENT.CHAPTER,
  NARRATIVE_ELEMENT.ACT,
];
```

### Step 5: Add "Edit Dialogue" Functionality

**File:** `src/components/NarrativeGraphEditor/NarrativeGraphEditor.tsx`

**Changes:**

1. Add new prop to NarrativeGraphEditor:

   ```typescript
   onEditPageDialogue?: (pageId: string, dialogueId: string) => void;
   ```

2. Create handler that calls this prop when "Edit Dialogue" is clicked:

   ```typescript
   const handleEditPageDialogue = useCallback((pageId: string) => {
     const page = effectiveThread.acts
       .flatMap(a => a.chapters.flatMap(c => c.pages))
       .find(p => p.id === pageId);
     if (page?.dialogueId && onEditPageDialogue) {
       onEditPageDialogue(pageId, page.dialogueId);
     }
   }, [effectiveThread, onEditPageDialogue]);
   ```

3. Pass to PageNodeContextMenu

**File:** `src/components/NarrativeWorkspace/NarrativeWorkspace.tsx` (or parent)

**Changes:**

- Implement `onEditPageDialogue` prop that:
  1. Sets `setActiveDialogueTab('page')`
  2. Calls `ensureDialogue(dialogueId, 'page')`
  3. Updates `selectedPage` state if needed

### Step 6: Disable Already-Connected Elements in Menus

**Files:**

- `ActNodeContextMenu.tsx`
- `ChapterNodeContextMenu.tsx`
- `PageEdgeDropMenu.tsx`

**Logic:**

- Acts can only add ONE chapter (the start chapter), so disable "Add Chapter" if the act already has a `startChapterId`
- Chapters can only add ONE page (the start page), so disable "Add Page" if the chapter already has a `startPageId`
- Pages can add freely (they link sequentially via `nextPageId`)

Wait - this conflicts with the linear requirement. Let me re-read:

> "we should have another context menu option... we always add something at the last node in the thread"

The user wants to ADD at the end of the linear sequence, not restrict adding. So:

- Adding from the LAST page in a chapter → adds next page
- Adding from the LAST chapter in an act → adds next chapter
- Adding from the LAST act → adds next act

**Updated Logic:**

- From Page: Always add after this page (sequential link via `nextPageId`)
- From Chapter context menu: Disabled if not the last chapter in act
- From Act context menu: Disabled if not the last act in thread

### Step 7: Enhance Path Highlighting

**Files:**

- `src/components/NarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts`
- Node components: `ActNode.tsx`, `ChapterNode.tsx`, `PageNode.tsx`, `ThreadNode.tsx`
- Edge component: `NPCEdgeV2.tsx` (or create narrative-specific edge)

**Current State:** Nodes get `isDimmed` and `isInPath`. Edges get `isInPathToSelected`.

**Enhancements:**

1. **Node Glowing Borders:** Update node components to apply glow effect when selected or in path:

   ```typescript
   const glowClass = isInPath 
     ? 'shadow-[0_0_15px_rgba(var(--node-color),0.6)]' 
     : '';
   ```

2. **Edge Colors by Node Type:** Modify converter or edge component to color edges based on source node type:

   - Thread → Act: `#8B5CF6` (purple)
   - Act → Chapter: `#3B82F6` (blue)
   - Chapter → Page: `#10B981` (green)
   - Page → Page: `#F59E0B` (amber)

3. **Add edge type metadata:**

   ```typescript
   edges.push({
     id: `thread-act-${act.id}`,
     source: thread.id,
     target: act.id,
     data: { 
       sourceType: NARRATIVE_ELEMENT.THREAD,
       targetType: NARRATIVE_ELEMENT.ACT,
       isInPathToSelected: false,
     },
   });
   ```

### Step 8: Fix handleAddElement Dependencies

**File:** `src/components/NarrativeGraphEditor/NarrativeGraphEditor.tsx`

**Change:**

```typescript
}, [effectiveThread, onChange, dialogueTreeId, reactFlowInstance, layoutDirection]);
//                                                                ^^^^^^^^^^^^^^^ ADD THIS
```

---

## Verification / Definition of Done

| Step | Verification |
| --- | --- |
| 1\. State sync fix | Add a node → click elsewhere → node persists. Add multiple nodes → all remain visible. |
| 2\. Remove sequential edges | No dashed lines between chapters or between acts. Only parent→child edges. |
| 3\. Page context menu | Right-click page shows: Add Page, Add Chapter, Add Act, Edit Dialogue, Delete |
| 4\. Page edge drop menu | Drag from page shows: Add Page, Add Chapter, Add Act |
| 5\. Edit Dialogue | Click "Edit Dialogue" → DialogueGraphEditor loads the page's dialogue tree, indicator shows "Page · \[Title\]" |
| 6\. Menu disabling | "Add Chapter" disabled on acts that aren't last; "Add Act" always works from last act |
| 7\. Path highlighting | Selected node has glow border. Edges are colored by source type. Path edges are brighter/animated. |
| 8\. Dependencies fix | No console warnings about missing dependencies. State updates work with layout direction changes. |

---

## Traceability Matrix

| Step | Target Files | Verification |
| --- | --- | --- |
| 1 | `NarrativeGraphEditor.tsx` | State persists after adding nodes |
| 2 | `narrative-converter.ts` | No chapter→chapter or act→act edges |
| 3 | `PageNodeContextMenu.tsx`, `NarrativeGraphEditor.tsx` | Menu shows all options, Edit Dialogue callback wired |
| 4 | `PageEdgeDropMenu.tsx` | Edge drop shows Page/Chapter/Act options |
| 5 | `NarrativeGraphEditor.tsx`, `NarrativeWorkspace.tsx` | Page dialogue loads in editor |
| 6 | Context menu components | Options disabled when not at end of sequence |
| 7 | `useNarrativePathHighlighting.ts`, node/edge components | Visual glow and colored edges |
| 8 | `NarrativeGraphEditor.tsx` | No dependency warnings |

---

## Dependencies

- Step 5 (Edit Dialogue) depends on understanding how `NarrativeWorkspace` manages the dialogue editor state.
  - I found out for you.  

    ```typescript
    import { useEffect, useState } from 'react';
    import type { DialogueTree, ViewMode } from '../../../types';
    import type { BaseGameState } from '../../../types/game-state';
    import type { FlagSchema } from '../../../types/flags';
    import type { StoryThread } from '../../../types/narrative';
    import { VIEW_MODE } from '../../../types/constants';
    
    interface UseNarrativeWorkspaceStateProps {
      initialThread: StoryThread | undefined;
      initialDialogue: DialogueTree | undefined;
      flagSchema?: FlagSchema;
      gameState?: BaseGameState;
    }
    
    const createEmptyThread = (): StoryThread => ({
      id: 'empty-thread',
      title: 'Empty Thread',
      acts: [],
    });
    
    const createEmptyDialogue = (): DialogueTree => ({
      id: 'empty-dialogue',
      title: 'Empty Dialogue',
      startNodeId: '',
      nodes: {},
    });
    
    export function useNarrativeWorkspaceState({
      initialThread,
      initialDialogue,
      flagSchema,
      gameState,
    }: UseNarrativeWorkspaceStateProps) {
      const [thread, setThread] = useState<StoryThread>(initialThread || createEmptyThread());
      const [dialogueTree, setDialogueTree] = useState<DialogueTree>(initialDialogue || createEmptyDialogue());
      const [activeFlagSchema, setActiveFlagSchema] = useState<FlagSchema | undefined>(flagSchema);
      const [activeGameState, setActiveGameState] = useState<BaseGameState>(() => gameState ?? { flags: {} });
      const [showPlayModal, setShowPlayModal] = useState(false);
      const [showFlagManager, setShowFlagManager] = useState(false);
      const [showGuide, setShowGuide] = useState(false);
      const [narrativeViewMode, setNarrativeViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);
      const [dialogueViewMode, setDialogueViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);
      const [showNarrativeMiniMap, setShowNarrativeMiniMap] = useState(true);
      const [showDialogueMiniMap, setShowDialogueMiniMap] = useState(true);
      const [dialogueScope, setDialogueScope] = useState<'page' | 'storylet'>('page');
      const [storyletFocusId, setStoryletFocusId] = useState<string | null>(null);
      const [gameStateDraft, setGameStateDraft] = useState(() => JSON.stringify(gameState ?? { flags: {} }, null, 2));
      const [gameStateError, setGameStateError] = useState<string | null>(null);
    ```

    it shouldn't be doing this.  it needs to use zustand.  which we need to have our main dialogue forge state (which we have in forge ui state) and states (slices) that make it up, events should be fired from the state of zustand.  we are emitting events in components.  I want events tied to the states.\
    \
    even the dialogue graph editor isnt using zustand for its state, it should.
- Step 7 (Path Highlighting) requires updates to both the hook and all node/edge components
- All steps can otherwise proceed independently