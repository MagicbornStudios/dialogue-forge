## Objective

Fix the narrative graph editor to properly display and edit the linear story structure (Thread → Act → Chapter → Page) with sequential page connections, using the old dagre-based layout and converter logic, while preserving all modern UI features and properly organizing storylet code separately.

## Core Changes

### 1. Update Type Definitions

**File:** `src/types/narrative.ts`

Add `start*Id` fields and `nextPageId` for sequential navigation:

- Add to `StoryThread`: `startActId?: string`
- Add to `NarrativeAct`: `startChapterId?: string`
- Add to `NarrativeChapter`: `startPageId?: string`
- Add to `NarrativePage`: `nextPageId?: string` (points to next page in sequence)
- Add to `NarrativePage`: `nextChapterId?: string` (optional: jump to different chapter)
- Add to `NarrativePage`: `nextActId?: string` (optional: jump to different act)

Keep all existing storylet types (StoryletTemplate, StoryletPool, etc.) - they stay in this file but won't be used by narrative graph converter.

**File:** `host-app/src/collections/Threads.ts` (Payload CMS)

Update the Threads collection schema to include:
- `startActId` field (text, optional)
- `startChapterId` field (text, optional)
- `startPageId` field (text, optional)

---

### 2. Create Storylet Helper Functions (Separate File)

**New File:** `src/utils/storylet-helpers.ts`

Move all storylet-related logic here (used by dialogue graph editor):

- `createStoryletTemplate(dialogueId, title, summary)`: creates new storylet template
- `addStoryletToChapter(thread, actId, chapterId, storyletTemplate)`: adds storylet template to chapter
- `createStoryletPool(title, selectionMode)`: creates new storylet pool
- `addStoryletPoolToChapter(thread, actId, chapterId, pool)`: adds pool to chapter
- `addMemberToPool(pool, templateId, weight)`: adds member to pool
- `updateStoryletTemplate(thread, actId, chapterId, templateId, updates)`: updates template
- `updateStoryletPool(thread, actId, chapterId, poolId, updates)`: updates pool
- `removeStoryletTemplate(thread, actId, chapterId, templateId)`: removes template
- `removeStoryletPool(thread, actId, chapterId, poolId)`: removes pool
- `getStoryletTemplate(thread, actId, chapterId, templateId)`: retrieves template
- `getStoryletPool(thread, actId, chapterId, poolId)`: retrieves pool

These functions operate on the `storyletTemplates` and `storyletPools` arrays within `NarrativeChapter`.

---

### 3. Create Narrative Helper Functions

**File:** `src/utils/narrative-helpers.ts`

Create helper functions for Thread/Act/Chapter/Page operations (NO storylet logic here):

#### Creation Functions:
- `createEmptyThread(title)`: creates thread with starter Act → Chapter → Page
- `addAct(thread, title)`: appends new act with starter chapter/page, updates `startActId` if first
- `addChapter(thread, actId, title)`: adds chapter to specific act, updates `startChapterId` if first
- `addPage(thread, actId, chapterId, title, dialogueId)`: adds page to chapter, updates `startPageId` if first, sets `nextPageId` of previous page to link sequentially

#### Update Functions:
- `updateThread(thread, updates)`: updates thread metadata (title, summary)
- `updateAct(thread, actId, updates)`: updates act metadata
- `updateChapter(thread, actId, chapterId, updates)`: updates chapter metadata
- `updatePage(thread, actId, chapterId, pageId, updates)`: updates page metadata (title, summary, dialogueId, nextPageId, nextChapterId, nextActId)

#### Delete Functions:
- `removeAct(thread, actId)`: removes act, updates `startActId` if removing start node
- `removeChapter(thread, actId, chapterId)`: removes chapter, updates `startChapterId` if removing start node
- `removePage(thread, actId, chapterId, pageId)`: removes page, updates `startPageId` and fixes `nextPageId` chain

#### Navigation/Link Functions:
- `linkPages(thread, actId, chapterId, fromPageId, toPageId)`: sets `fromPage.nextPageId = toPageId`
- `linkPageToChapter(thread, actId, chapterId, fromPageId, toChapterId)`: sets `fromPage.nextChapterId = toChapterId`, clears `nextPageId`
- `linkPageToAct(thread, actId, chapterId, fromPageId, toActId)`: sets `fromPage.nextActId = toActId`, clears `nextPageId` and `nextChapterId`
- `unlinkPage(thread, actId, chapterId, pageId)`: clears `nextPageId`, `nextChapterId`, `nextActId`

#### Retrieval Functions:
- `getAct(thread, actId)`: retrieves act by ID
- `getChapter(thread, actId, chapterId)`: retrieves chapter by ID
- `getPage(thread, actId, chapterId, pageId)`: retrieves page by ID
- `findPageParent(thread, pageId)`: returns { act, chapter } containing the page (needed for cross-chapter links)

All functions return new immutable `StoryThread` instances.

---

### 4. Rewrite `narrative-converter.ts`

**File:** `src/utils/narrative-converter.ts`

Replace current implementation with old-style logic, adapted for sequential page flow:

#### Helper Functions:
```typescript
function basePosition(index: number, depth: number, direction: LayoutDirection): { x: number; y: number } {
  const spacingX = 320;
  const spacingY = 220;
  if (direction === 'LR') {
    return { x: depth * spacingX, y: index * spacingY };
  }
  return { x: index * spacingX, y: depth * spacingY };
}
```

#### `convertNarrativeToReactFlow(thread: StoryThread, direction: LayoutDirection = 'TB')`:

**Node Creation:**
1. Create thread node at depth 0
2. For each act (depth 1):
   - Create act node
   - Create edge: thread → act (animated if `act.id === thread.startActId`)
3. For each chapter in act (depth 2):
   - Create chapter node
   - Create edge: act → chapter (animated if `chapter.id === act.startChapterId`)
4. For each page in chapter (depth 3):
   - Create page node
   - Create edge: chapter → page (animated if `page.id === chapter.startPageId`)
5. **Sequential page linking (depth 3 → 3):**
   - If `page.nextPageId` exists:
     - Create edge: page → nextPage (within same chapter or different chapter)
     - Mark edge as animated if it's the first page's link
   - If `page.nextChapterId` exists (jump to different chapter):
     - Create edge: page → chapter (target is the chapter node)
     - Label edge with "→ [Chapter Title]"
   - If `page.nextActId` exists (jump to different act):
     - Create edge: page → act (target is the act node)
     - Label edge with "→ [Act Title]"

**Node Data Structure:**
```typescript
{
  id: element.id,
  type: NARRATIVE_ELEMENT.THREAD | ACT | CHAPTER | PAGE,
  position: basePosition(index, depth, direction),
  data: {
    label: element.title || `Untitled ${type}`,
    type: elementType,
    description: element.summary,
    meta: { actId?, chapterId?, pageId? }, // hierarchy context
  },
  sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
  targetPosition: direction === 'LR' ? Position.Left : Position.Top,
}
```

**Edge Types:**
- Thread → Act: `{ id: 'thread-act-{actId}', source: threadId, target: actId, animated: isStart }`
- Act → Chapter: `{ id: 'act-chapter-{chapterId}', source: actId, target: chapterId, animated: isStart }`
- Chapter → Page: `{ id: 'chapter-page-{pageId}', source: chapterId, target: pageId, animated: isStart }`
- Page → Page: `{ id: 'page-page-{fromId}-{toId}', source: fromId, target: toId, animated: isFirstLink, label: undefined }`
- Page → Chapter: `{ id: 'page-chapter-{pageId}-{chapterId}', source: pageId, target: chapterId, label: '→ [Chapter]' }`
- Page → Act: `{ id: 'page-act-{pageId}-{actId}', source: pageId, target: actId, label: '→ [Act]' }`

#### `convertReactFlowToNarrative(nodes: Node[], edges: Edge[]): StoryThread`:

**Reconstruction Logic:**
1. Find thread node (type === 'thread')
2. Build edge maps:
   - `threadToActs`: edges from thread → act
   - `actToChapters`: edges from act → chapter
   - `chapterToPages`: edges from chapter → page
   - `pageToPage`: edges from page → page
   - `pageToChapter`: edges from page → chapter
   - `pageToAct`: edges from page → act
3. Rebuild hierarchy:
   - For each act connected to thread:
     - Create NarrativeAct
     - For each chapter connected to this act:
       - Create NarrativeChapter
       - For each page connected to this chapter:
         - Create NarrativePage
         - Set `nextPageId` from pageToPage edges
         - Set `nextChapterId` from pageToChapter edges
         - Set `nextActId` from pageToAct edges
4. Detect start nodes:
   - `startActId`: act with animated edge from thread
   - `startChapterId` (per act): chapter with animated edge from act
   - `startPageId` (per chapter): page with animated edge from chapter
5. Sort nodes by position (Y then X for TB, X then Y for LR) to maintain visual order
6. Return complete StoryThread

**Fallback for missing start IDs:** If no animated edge found, use first child (e.g., `thread.acts[0].id`).

---

### 5. Update `NarrativeGraphEditor.tsx`

**File:** `src/components/NarrativeGraphEditor/NarrativeGraphEditor.tsx`

#### Keep All Modern Features:
- Context menus (pane, node, edge)
- Path highlighting hook (`useNarrativePathHighlighting`)
- Layout controls (direction, auto-organize, show path highlight, show back edges)
- MiniMap, toolbar, background
- Node types (ThreadNode, ActNode, ChapterNode, PageNode)
- Edge types (NPCEdgeV2)

#### Fix Converter Integration:
- Import updated `convertNarrativeToReactFlow` and `convertReactFlowToNarrative`
- Pass `layoutDirection` state to converter
- Import helper functions from `narrative-helpers.ts`

#### Update `handleAddElement`:
- **Add Act**: use `addAct(thread, 'New Act')` from helpers
- **Add Chapter**: use `addChapter(thread, actId, 'New Chapter')` from helpers
- **Add Page**: use `addPage(thread, actId, chapterId, 'New Page', dialogueTreeId)` from helpers
- If auto-connecting from a page node:
  - Use `linkPages(thread, actId, chapterId, fromPageId, newPageId)` to create sequential link
- If auto-connecting from a chapter node:
  - Add page as first page in chapter, set as `startPageId`

#### Update `handleDeleteElement`:
- Use `removeAct`, `removeChapter`, `removePage` from helpers
- Helpers will handle updating start IDs and fixing page chains

#### Update `handleUpdateElement`:
- Use `updateThread`, `updateAct`, `updateChapter`, `updatePage` from helpers

#### Edge Connection Validation:
```typescript
const validConnections = {
  [NARRATIVE_ELEMENT.THREAD]: [NARRATIVE_ELEMENT.ACT],
  [NARRATIVE_ELEMENT.ACT]: [NARRATIVE_ELEMENT.CHAPTER],
  [NARRATIVE_ELEMENT.CHAPTER]: [NARRATIVE_ELEMENT.PAGE],
  [NARRATIVE_ELEMENT.PAGE]: [
    NARRATIVE_ELEMENT.PAGE,    // sequential page link
    NARRATIVE_ELEMENT.CHAPTER, // jump to different chapter
    NARRATIVE_ELEMENT.ACT,     // jump to different act
  ],
};

// In onConnect callback:
if (!validConnections[sourceNode.type]?.includes(targetNode.type)) {
  return; // Reject invalid connection
}

// If Page → Page: use linkPages helper
// If Page → Chapter: use linkPageToChapter helper
// If Page → Act: use linkPageToAct helper
```

#### Layout Trigger:
- When user clicks "Apply Layout", call dagre with current `layoutDirection`:
  ```typescript
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: layoutDirection, // 'TB' or 'LR'
    nodesep: 80,
    ranksep: 120,
    marginx: 50,
    marginy: 50,
    ranker: 'network-simplex',
    align: 'UL',
  });
  
  nodes.forEach(node => {
    g.setNode(node.id, { width: node.width || 220, height: node.height || 100 });
  });
  
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(g);
  
  const updatedNodes = nodes.map(node => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - (node.width || 220) / 2,
        y: dagreNode.y - (node.height || 100) / 2,
      },
    };
  });
  
  setNodes(updatedNodes);
  reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
  ```

---

### 6. Update Path Highlighting Hook

**File:** `src/components/NarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts`

Adjust to follow sequential page chains:

- Start from selected node
- If selected node is a page:
  - Trace backward: page → chapter → act → thread
  - Trace forward: page → nextPage → nextPage... OR page → nextChapter/nextAct
- Mark all edges in both directions as "in path"
- Use `start*Id` fields to identify primary paths (animated edges)

---

### 7. Update Edge Drop Menus

**Files:**
- `src/components/NarrativeGraphEditor/components/PageEdgeDropMenu.tsx`
- `src/components/NarrativeGraphEditor/components/PageNodeContextMenu.tsx`

When dragging from a Page node and dropping on empty space, show menu:
- **Add Next Page** (creates page, links sequentially via `nextPageId`)
- **Jump to Chapter** (select existing chapter, sets `nextChapterId`)
- **Jump to Act** (select existing act, sets `nextActId`)

When right-clicking a Page node, show context menu:
- **Edit**
- **Add Next Page** (same as edge drop)
- **Link to Chapter** (shows chapter picker)
- **Link to Act** (shows act picker)
- **Unlink** (clears `nextPageId`, `nextChapterId`, `nextActId`)
- **Delete**

---

### 8. Organize Imports and File Structure

#### New File Structure:
```
src/
├── utils/
│   ├── narrative-converter.ts       (Thread/Act/Chapter/Page only)
│   ├── narrative-helpers.ts         (Thread/Act/Chapter/Page CRUD)
│   └── storylet-helpers.ts          (NEW - Storylet CRUD)
├── types/
│   └── narrative.ts                 (All types: Thread, Act, Chapter, Page, Storylet, Pool)
├── components/
│   ├── NarrativeGraphEditor/        (Thread/Act/Chapter/Page graph)
│   │   ├── NarrativeGraphEditor.tsx
│   │   ├── components/
│   │   │   ├── ThreadNode/
│   │   │   ├── ActNode/
│   │   │   ├── ChapterNode/
│   │   │   └── PageNode/
│   │   └── hooks/
│   │       └── useNarrativePathHighlighting.ts
│   └── DialogueGraphEditor/         (Dialogue trees + Storylets)
│       ├── DialogueGraphEditor.tsx
│       └── components/
│           └── StoryletNode/        (EXISTING - used for storylet editing)
```

#### Import Rules:
- `narrative-converter.ts`: imports only from `src/types/narrative.ts` (Thread, Act, Chapter, Page types)
- `narrative-helpers.ts`: imports only Thread/Act/Chapter/Page types, NOT storylet types
- `storylet-helpers.ts`: imports Storylet types (StoryletTemplate, StoryletPool, etc.)
- `NarrativeGraphEditor.tsx`: imports `narrative-converter.ts` and `narrative-helpers.ts`, NOT `storylet-helpers.ts`
- `DialogueGraphEditor.tsx`: can import both `storylet-helpers.ts` and storylet types

---

### 9. Preserve Modern UI Features (No Changes Needed)

**Keep unchanged:**
- `GraphMiniMap`, `GraphLeftToolbar`, `GraphLayoutControls` components
- `useNarrativePathHighlighting` hook (update logic only)
- Context menus: `NarrativeGraphEditorPaneContextMenu`, `ThreadNodeContextMenu`, `ActNodeContextMenu`, `ChapterNodeContextMenu`, `PageNodeContextMenu`
- Edge menus: `ThreadEdgeDropMenu`, `ActEdgeDropMenu`, `ChapterEdgeDropMenu`, `PageEdgeDropMenu`, `ActEdgeContextMenu`, `ChapterEdgeContextMenu`, `PageEdgeContextMenu`
- Node components: `ThreadNode`, `ActNode`, `ChapterNode`, `PageNode` (all fields, styling, interactive features)
- Edge component: `NPCEdgeV2`
- Node editor panel integration (`onSelectElement` callback)

---

## Verification & Definition of Done

### Type Definitions:
- `StoryThread` has `startActId?: string`
- `NarrativeAct` has `startChapterId?: string`
- `NarrativeChapter` has `startPageId?: string`
- `NarrativePage` has `nextPageId?: string`, `nextChapterId?: string`, `nextActId?: string`

### File Organization:
- `storylet-helpers.ts` exists and contains all storylet CRUD functions
- `narrative-helpers.ts` exists and contains all Thread/Act/Chapter/Page CRUD functions
- `narrative-converter.ts` does NOT import any storylet types
- `NarrativeGraphEditor.tsx` does NOT import `storylet-helpers.ts`

### Converter Correctness:
- `convertNarrativeToReactFlow(thread, 'TB')` produces nodes with Y-based depth positioning
- `convertNarrativeToReactFlow(thread, 'LR')` produces nodes with X-based depth positioning
- Edges follow hierarchy: Thread→Act, Act→Chapter, Chapter→Page, Page→Page/Chapter/Act
- Sequential page links use `page.nextPageId`
- Chapter/Act jumps use `page.nextChapterId` and `page.nextActId`
- Animated edges mark start nodes
- `convertReactFlowToNarrative(nodes, edges)` rebuilds thread with correct nesting, sequential links, and start IDs

### Helper Functions:
- `createEmptyThread()` returns valid thread with one act, chapter, page
- `addPage()` links new page to previous page via `nextPageId`
- `linkPages()`, `linkPageToChapter()`, `linkPageToAct()` correctly set navigation fields
- `removePage()` fixes broken page chains

### Graph Layout:
- "Apply Layout" button triggers dagre with current direction (TB or LR)
- Nodes are evenly spaced, no overlaps
- Layout direction toggle works

### CRUD Operations:
- Add Act/Chapter/Page via context menus works
- Delete node removes from graph and updates thread structure
- Edit node updates graph label and thread data
- Drag from Page, drop on empty space → shows "Add Next Page" / "Jump to Chapter" / "Jump to Act" menu
- Connecting Page → Page sets `nextPageId` and creates sequential edge
- Connecting Page → Chapter sets `nextChapterId` and creates jump edge with label
- Connecting Page → Act sets `nextActId` and creates jump edge with label

### Path Highlighting:
- Clicking a page highlights: Thread → Act → Chapter → Page → NextPage chain
- Edges on path are visually distinct
- Non-path nodes are dimmed
- Toggle works

### Persistence:
- Changes update `thread` object with all new fields
- `onChange(thread)` fires with updated thread
- Payload CMS schema includes `startActId`, `startChapterId`, `startPageId`

---

## End-to-End Scenario

**Scenario:** Create a simple 2-act story with page sequences and chapter jump

1. Open narrative graph editor with empty thread
2. Thread node appears at origin
3. Right-click pane → Add Act → "Act 1" appears, connected to Thread (animated edge)
4. Right-click "Act 1" → Add Chapter → "Chapter 1" appears, connected to Act 1 (animated edge)
5. Right-click "Chapter 1" → Add Page → "Page 1" appears, connected to Chapter 1 (animated edge)
6. Right-click "Page 1" → Add Next Page → "Page 2" appears, connected to Page 1 (sequential edge)
7. Drag from "Page 2" handle, drop on empty space → menu → Add Next Page → "Page 3" created and connected
8. Right-click pane → Add Act → "Act 2" created
9. Right-click "Act 2" → Add Chapter → "Chapter 2" created
10. Right-click "Chapter 2" → Add Page → "Page 4" created
11. Right-click "Page 3" → Link to Chapter → select "Chapter 2" → edge created from Page 3 to Chapter 2 with label "→ Chapter 2"
12. Click "Apply Layout" → all nodes rearrange in clean hierarchy
13. Click "Page 3" → path highlights: Thread → Act 1 → Chapter 1 → Page 1 → Page 2 → Page 3 → Chapter 2
14. Edit "Act 1" title to "The Beginning" → label updates
15. Delete "Page 2" → edge from Page 1 now points to Page 3 (chain fixed)
16. Save → Payload CMS receives thread with all start IDs and page navigation fields

---

## Traceability Matrix

| Step | Target Files | Verification Method |
|------|--------------|---------------------|
| 1. Update types | `src/types/narrative.ts`, `host-app/src/collections/Threads.ts` | TypeScript compiles, new fields present |
| 2. Create storylet helpers | `src/utils/storylet-helpers.ts` | File exists, exports all storylet functions |
| 3. Create narrative helpers | `src/utils/narrative-helpers.ts` | File exists, exports all CRUD functions, unit tests pass |
| 4. Rewrite converter | `src/utils/narrative-converter.ts` | Convert thread → nodes/edges → thread, verify equality |
| 5. Update graph editor | `src/components/NarrativeGraphEditor/NarrativeGraphEditor.tsx` | Integration test: add/edit/delete/connect operations work |
| 6. Update path highlighting | `src/components/NarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts` | Manual test: click page, verify path trace |
| 7. Update edge menus | `PageEdgeDropMenu.tsx`, `PageNodeContextMenu.tsx` | Manual test: menus show correct options |
| 8. Organize imports | All files | No circular dependencies, clean separation |
| 9. Verify UI features | All components | Visual test: all menus, highlighting, controls functional |

