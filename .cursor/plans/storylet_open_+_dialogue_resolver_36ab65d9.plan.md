---
name: Storylet open + dialogue resolver
overview: Fix storylet 'Open Dialogue' by adding a dialogue resolver + cache and a Page/StoryletTemplate tab model in the Dialogue panel, with a demo in-memory resolver. Sets foundation for upcoming GameStateManager and editor parity work.
todos:
  - id: resolver-contract
    content: Add resolveDialogue prop and implement a dialogue cache hook (ensure/get/set) for dialogueId -> DialogueTree.
    status: pending
  - id: workspace-two-dialogues
    content: Refactor NarrativeWorkspace to track pageDialogueId and storyletDialogueId plus active tab; remove buildScopedDialogue-based storylet switching.
    status: pending
    dependencies:
      - resolver-contract
  - id: dialogue-panel-tabs
    content: Update DialogueGraphSection to a shadcn Tabs model (Page | StoryletTemplate) while keeping Graph/Yarn toggle per tab.
    status: pending
    dependencies:
      - workspace-two-dialogues
  - id: storylets-open-action
    content: Add explicit Open Dialogue action in StoryletsSidebar (and ensure right-click action loads storylet dialogueId) to switch to StoryletTemplate tab.
    status: pending
    dependencies:
      - dialogue-panel-tabs
  - id: demo-resolver
    content: Implement in-memory resolveDialogue in app/page.tsx using example dialogues so storylet templates can load canonical dialogues.
    status: pending
    dependencies:
      - workspace-two-dialogues
  - id: validate
    content: Run build and manually verify page/storylet tab switching + editing works; fix regressions.
    status: pending
    dependencies:
      - storylets-open-action
      - demo-resolver
---

# Fix Storylet “Open Dialogue” + Add `resolveDialogue` (Page | StoryletTemplate tabs)

## Why this is needed

Right now the workspace holds **one** `dialogueTree`. When you open a storylet template whose `dialogueId` differs from the currently loaded page dialogue, the editor can’t load it (it either shows an empty graph or appears to do nothing). The correct architecture is **host-resolved dialogues** with a **small cache** inside the Forge UI.

## Goals

- Make **Storylet “Open Dialogue” reliably open the canonical template dialogue**.
- Introduce `resolveDialogue(dialogueId)` as the canonical loading mechanism.
- Add a **Page | StoryletTemplate tab model** in the Dialogue panel.
- Keep changes scoped (no full GamePlayer/GameStateManager/DialogueEditorV2 rewrite yet).

## Implementation

### 1) Add resolver contract + cache

- Add a new prop to `NarrativeWorkspace` (and later `DialogueForge`):
- `resolveDialogue?: (dialogueId: string) => Promise<DialogueTree>`
- Add a tiny internal cache hook:
- `useDialogueCache()` with:
- `get(dialogueId)`
- `ensure(dialogueId)` (loads via resolver, caches)
- `set(dialogueId, tree)` for local edits

Files:

- [`src/components/NarrativeWorkspace.tsx`](src/components/NarrativeWorkspace.tsx)
- New: `src/components/forge/hooks/useDialogueCache.ts`

### 2) Track two loaded dialogues and active tab

- Replace the current `dialogueScope/storyletFocusId/buildScopedDialogue` approach with explicit loaded IDs:
- `pageDialogueId` (from selected page)
- `storyletDialogueId` (from opened storylet template)
- `activeDialogueTab: 'page' | 'storyletTemplate'`
- When selecting a page, load that page’s dialogue via `resolveDialogue(page.dialogueId)` and switch tab to **Page**.
- When opening a storylet template, load `template.dialogueId` and switch tab to **StoryletTemplate**.

Files:

- [`src/components/NarrativeWorkspace.tsx`](src/components/NarrativeWorkspace.tsx)
- [`src/components/NarrativeWorkspace/hooks/useNarrativeSelection.ts`](src/components/NarrativeWorkspace/hooks/useNarrativeSelection.ts) (remove/stop using scopedDialogue logic for storylets)

### 3) Update Dialogue panel UI to Tabs

- Update `DialogueGraphSection` header to use shadcn `Tabs`:
- Tabs: **Page** and **Storylet Template**
- Disable Storylet tab until a storylet dialogue is opened
- Preserve Graph/Yarn sub-toggle within each tab as-is

Files:

- [`src/components/NarrativeWorkspace/components/DialogueGraphSection.tsx`](src/components/NarrativeWorkspace/components/DialogueGraphSection.tsx)

### 4) Wire StoryletSidebar “Open Dialogue”

- Add an explicit “Open Dialogue” action in `StoryletsSidebar` UI (not only right-click), using shadcn Button / DropdownMenu.
- Ensure right-click context menu action still works.

Files:

- [`src/components/NarrativeWorkspace/components/StoryletsSidebar.tsx`](src/components/NarrativeWorkspace/components/StoryletsSidebar.tsx)
- [`src/components/NarrativeWorkspace.tsx`](src/components/NarrativeWorkspace.tsx)

### 5) Demo in-memory resolver

- In the demo `app/page.tsx`, implement `resolveDialogue` as an in-memory map for now.
- Map must include the page dialogue and the storylet template dialogues referenced in the example thread.

Files:

- [`app/page.tsx`](app/page.tsx)
- Potentially: `src/examples/*` if we need multiple DialogueTrees to wire up the map.

### 6) Validation

- `npm run build`
- Manual checks:
- Selecting a page loads the page dialogue
- “Open Dialogue” on a storylet opens the template dialogue under the Storylet tab
- Switching back and forth preserves edits per dialogueId

## Notes (future work, not in this plan)

- Replace `FlagManagerModal` with `GameStateManager` (authored vs runtime state)
- Narrative graph editor parity with Dialogue editor (node inspector, add/reattach, layout)
- DialogueEditorV2 refactor