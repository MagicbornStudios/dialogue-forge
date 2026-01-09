---
name: Zustand UI store + events + storylet open
overview: Introduce a Zustand UI store (sliced by panel/editor), add a v1 event dispatch system, then re-implement dialogue loading + Page/StoryletTemplate tabs on top so storylet Open Dialogue works reliably.
todos:
  - id: add-zustand-deps
    content: Add zustand dependency and decide on vanilla store + hook wrapper pattern for library consumption.
    status: completed
  - id: forge-ui-store
    content: "Create `forge-ui-store` with slices: layout, narrativeGraph, dialogueGraph, storylets, modals; use constants (VIEW_MODE) not string literals."
    status: completed
    dependencies:
      - add-zustand-deps
  - id: event-v1-types
    content: Create v1 event envelope + typed union + createEvent helper; add NarrativeWorkspace prop `onEvent` and a `dispatch` helper wired to store actions.
    status: completed
    dependencies:
      - forge-ui-store
  - id: migrate-workspace-state
    content: Refactor NarrativeWorkspace to read/write UI state from Zustand instead of local useState/useEffect; keep canonical thread/dialogue outside store.
    status: completed
    dependencies:
      - forge-ui-store
      - event-v1-types
  - id: dialogue-tabs-model
    content: Implement Page|StoryletTemplate tab model in store and in DialogueGraphSection UI using shadcn Tabs.
    status: completed
    dependencies:
      - migrate-workspace-state
  - id: resolver-contract
    content: Add `resolveDialogue(dialogueId)` prop and a small cache; load page dialogue on page selection; load storylet dialogue on open.
    status: completed
    dependencies:
      - dialogue-tabs-model
  - id: storylet-open-actions
    content: Add explicit StoryletsSidebar Open Dialogue action (and keep context menu) to open canonical template dialogue and switch tabs; emit events.
    status: completed
    dependencies:
      - resolver-contract
  - id: demo-in-memory-resolver
    content: Implement in-memory resolveDialogue in app/page.tsx with example dialogues; pass into NarrativeWorkspace.
    status: completed
    dependencies:
      - resolver-contract
  - id: unit-tests-store-events
    content: Add Vitest unit tests for store slices + event creation + storylet-open flow (mock resolver).
    status: completed
    dependencies:
      - event-v1-types
      - storylet-open-actions
  - id: build-verify
    content: Run npm build/dev and fix any regressions; ensure storylet open visibly loads the correct dialogue in StoryletTemplate tab.
    status: completed
    dependencies:
      - demo-in-memory-resolver
      - unit-tests-store-events
---

# Zustand UI Store + Event System + Storylet Open (Page|StoryletTemplate tabs)

## Goals

- Replace `useState` soup in [`src/components/NarrativeWorkspace/hooks/useNarrativeWorkspaceState.ts`](src/components/NarrativeWorkspace/hooks/useNarrativeWorkspaceState.ts) with a **Zustand UI store** (UI-only).
- Split state into **clear panel/editor slices**:
- NarrativeGraphEditor state
- DialogueGraphEditor state
- StoryletsPanel state
- Modals/overlays state
- Layout/tabs state
- Introduce a **v1 event dispatch system** that is designed for host-owned persistence (Payload later) and works alongside Zustand.
- Fix the user-reported bug: **Storylet “Open Dialogue” loads canonical template dialogue** via a resolver and shows it under a **StoryletTemplate tab**.

## Non-goals (this plan intentionally does NOT do)

- No GameStateManager redesign yet
- No GamePlayer redesign yet
- No DialogueEditorV2 refactor yet
- No canonical persistence in Zustand (thread/dialogues remain host-canonical)

## Architecture

### A) Zustand store is UI-only (locked)

Zustand owns:

- view tabs (Graph/Yarn per panel)
- active page vs active storylet-template tab
- selection (narrative selected element, selected storylet)
- modal open/close
- context menu coordinates - (maybe, at least not for shadcn components outside of reactflow)

Zustand does **not** own:

- canonical thread data
- canonical dialogue persistence

### B) v1 events: store + UI actions emit events

We add a `dispatch(event)` function and a typed event union (v1). UI actions:

- update the UI store
- emit a corresponding event via `onEvent?.(event)` prop

### C) Dialogue loading via resolver (host-canonical)

To make “Open Dialogue” work:

- add `resolveDialogue(dialogueId)` as a prop
- implement a small local cache (can be `useRef(Map)` or TanStack Query in host later)
- implement Dialogue panel tabs:
- Page
- StoryletTemplate

## Implementation steps

### 1) Add Zustand + store structure

Create `src/components/forge/store/forge-ui-store.ts`:

- `createForgeUIStore()` (vanilla store) or `useForgeUIStore()` hook.
- Slices:
- `layoutSlice`: active tabs, panel sizes
- `narrativeGraphSlice`: viewMode, minimap, selection
- `dialogueGraphSlice`: viewMode, minimap, active dialogue tab
- `storyletsSlice`: selected storylet key, search, active pool, context menu
- `modalsSlice`: play modal, game state modal, guide modal

Replace string literals with constants (`VIEW_MODE.GRAPH`, etc.).

### 2) Migrate NarrativeWorkspace state usage

Refactor [`src/components/NarrativeWorkspace.tsx`](src/components/NarrativeWorkspace.tsx):

- remove most local `useState`
- read/write UI state via Zustand selectors
- keep canonical `thread` and canonical dialogues outside Zustand

Deprecate or delete (later) `useNarrativeWorkspaceState.ts` once consumers are migrated.

### 3) Add v1 event types + dispatch

Add `src/components/forge/events/events.ts`:

- `DialogueForgeEventV1` envelope
- union type for key events (`narrative.select`, `dialogue.openRequested`, `dialogue.changed`, `ui.tabChanged`, etc.)
- `createEvent(type,payload)` helper

Wire `dispatch(event)` into `NarrativeWorkspace` props:

- `onEvent?: (event: DialogueForgeEventV1) => void`

### 4) Fix Storylet “Open Dialogue” with resolver + Dialogue tabs

Implement the previously planned fix, but with Zustand:

- `resolveDialogue?: (dialogueId: string) => Promise<DialogueTree>`
- store fields:
- `dialogueGraph.activeTab = 'page'|'storyletTemplate'`
- `dialogueGraph.pageDialogueId`
- `dialogueGraph.storyletDialogueId`
- Update `DialogueGraphSection` to show shadcn Tabs:
- Page | StoryletTemplate
- Graph/Yarn toggle remains as-is per panel

### 5) Storylets “Open Dialogue” UX

- Add explicit “Open Dialogue” action to Storylets list items (Button or DropdownMenu)
- Keep right-click menu action
- Both actions call:
- `dispatch({type:'storyletTemplate.openRequested', payload:{templateId, dialogueId}})`
- set `dialogueGraph.activeTab = 'storyletTemplate'`

### 6) Demo resolver (in-memory)

In [`app/page.tsx`](app/page.tsx):

- implement `resolveDialogue(dialogueId)` using an in-memory map of example DialogueTrees
- pass it to the workspace

### 7) Validation + tests (initial)

- Add unit tests for:
- store slice reducers/actions (Zustand store behavior)
- event creation (shape/version/id)
- storylet open flow: selecting storylet sets correct tab + calls resolver

## Files likely touched

- [`src/components/NarrativeWorkspace.tsx`](src/components/NarrativeWorkspace.tsx)
- [`src/components/NarrativeWorkspace/components/DialogueGraphSection.tsx`](src/components/NarrativeWorkspace/components/DialogueGraphSection.tsx)
- [`src/components/NarrativeWorkspace/components/StoryletsSidebar.tsx`](src/components/NarrativeWorkspace/components/StoryletsSidebar.tsx)
- New: `src/components/forge/store/forge-ui-store.ts`
- New: `src/components/forge/events/events.ts`
- [`app/page.tsx`](app/page.tsx)

## Implementation todos