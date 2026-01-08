# Dialogue Forge Architecture & Code Review

This document summarizes how the codebase is organized, what the app is intended
to do, and where the current implementation feels confusing or inconsistent. It
is meant to be a living review so contributors can prioritize cleanup work.

## 1. What this project is intended to do

Dialogue Forge is a **visual, node-based dialogue editor** and **runtime
simulator** intended for narrative/game teams. It provides:

- A **graph editor** for authoring branching dialogue with conditions, flags,
  and storylet/randomizer nodes.
- A **Yarn Spinner import/export pipeline** so the authored content can move
  between the editor and external tools.
- A **flag system** for gameplay state, with schema-driven validation and
  runtime updates.
- A **narrative layer** (threads/acts/chapters/pages/storylets) to organize
  dialogue nodes into higher-level story structures.
- A **demo application** (Next.js) that exercises the editor and players.

The exported package is both a **library** (components, hooks, types, utilities)
and a **demo experience** for exploring the editor UI.

## 2. High-level architecture

### 2.1 Source-of-truth data models

The **primary data structures** are defined in `src/types`:

- `DialogueTree` and `DialogueNode` represent the graph-based dialogue content.
- `FlagSchema` and flag types define validation and runtime flag behavior.
- Narrative types (`StoryThread`, `NarrativeAct`, `NarrativeChapter`,
  `NarrativePage`, `Storylet`, `StoryletPool`) model the story structure that
  wraps dialogue graphs.

The project’s guiding rule is to use **type constants** (e.g. `NODE_TYPE`,
`FLAG_TYPE`, `VIEW_MODE`) instead of string literals for type comparisons.

### 2.2 Core libraries (non-UI logic)

The `src/lib` folder encapsulates the logic that powers the editor and runtime:

- `yarn-converter.ts` handles **import/export** between `DialogueTree` and Yarn
  `.yarn` content.
- `yarn-runner/` provides a **Yarn execution engine**:
  condition evaluation, variable operations, and node traversal.
- `flag-manager.ts` provides **flag initialization, merging, and validation**.

These libraries define the functional backbone and should stay UI-agnostic.

### 2.3 Editor UI & visualization

The editor is powered by **React Flow** and custom node/edge components:

- `DialogueEditorV2` renders and edits `DialogueTree` content.
- `NPCNodeV2`, `PlayerNodeV2`, `ConditionalNodeV2`, `StoryletDialogueNodeV2`,
  and `RandomizerDialogueNodeV2` render node-specific UI.
- `ChoiceEdgeV2` and `NPCEdgeV2` render custom edges.
- `reactflow-converter.ts` bridges the editor between React Flow data and
  the `DialogueTree` structure.

### 2.4 Narrative layer UI

The narrative toolset is layered on top of the dialogue editor:

- `NarrativeWorkspace` manages the overall story structure and embeds
  `DialogueEditorV2`.
- `NarrativeGraphView` renders narrative thread/act/chapter/page structures.
- Narrative utilities in `src/utils/narrative-*` convert between narrative
  structures and graph data for visualization.

### 2.5 Runtime/Playback

There are two playback experiences:

- **Legacy**: `ScenePlayer` (aliased as `DialogueSimulator` in exports).
- **Current**: `GamePlayer` uses `useDialogueRunner` and
  `useNarrativeTraversal` to drive a more robust narrative-play experience.

`PlayView` is the editor-integrated preview that uses the runtime logic.

### 2.6 Demo application

The repo’s root contains a **Next.js demo app**:

- `app/page.tsx` boots a `NarrativeWorkspace` demo with sample data.
- `next.config.mjs` aliases `@magicborn/dialogue-forge` to the repo root so the
  demo can import source files directly.

This is the primary “in-repo” way to interact with the editor.

## 3. Major data flows

### 3.1 Editor ↔ DialogueTree

`DialogueEditorV2` uses `reactflow-converter.ts` to:

1. Convert a `DialogueTree` into React Flow nodes/edges.
2. Render/edit in the UI.
3. Convert edits back into `DialogueTree` so upstream consumers can save/export.

### 3.2 DialogueTree ↔ Yarn

`exportToYarn` converts nodes (NPC, Player, Conditional) into Yarn syntax. The
generated output also contains Yarn variable operations (`<<set $flag ...>>`).

`importFromYarn` parses Yarn content and rebuilds `DialogueTree` structures.

### 3.3 Runtime play

`useDialogueRunner` executes the graph as a sequence of dialogue steps with
conditions and flag operations. `GamePlayer` overlays narrative structure on top
of this sequence to give a “page/act/chapter” framing.

## 4. Areas of confusion and likely problems

### 4.1 README vs actual exports

The README documents a `DialogueEditor` component, but the public export is
`DialogueEditorV2`. This can confuse users trying to follow the Quick Start and
copy/paste sample code.

**Recommendation:** Standardize documentation around `DialogueEditorV2` and
explicitly mention legacy aliases (`DialogueSimulator` → `ScenePlayer`).

### 4.2 CLI demo runner vs repository layout

`bin/dialogue-forge.js` expects a `/demo` directory to exist so it can run
`npm run dev` inside it. The current repo structure uses the root Next.js app
(`app/`) instead of `demo/`. The `files` list in `package.json` also does not
package a `demo/` directory.

**Impact:** `npx @magicborn/dialogue-forge` may fail in the published package or
in this repo unless a `demo` folder is added.

**Recommendation:** Align the CLI with the repo layout (run the root Next app),
or reintroduce and publish a `demo/` directory.

### 4.3 Build scripts do not clearly separate library vs demo

`npm run build` triggers a Next.js build. `build:lib` generates the `dist`
library artifacts, and `prepublishOnly` uses `build:lib`. This makes it easy to
think the library is built with `npm run build` when it is not.

**Recommendation:** Update scripts or docs so “library build” and “demo build”
are explicit (`build:demo`, `build:lib`).

### 4.4 String literal type checks in core logic

The project’s own guideline says “never use string literals for types,” but
there are several core files (e.g. `yarn-converter.ts` and `flag-manager.ts`)
that still compare against string literals (`'npc'`, `'player'`, `'number'`).

**Recommendation:** Replace these with `NODE_TYPE`, `FLAG_VALUE_TYPE`, and
other exported constants to enforce consistent usage.

### 4.5 Yarn export is not storylet-aware

`exportToYarn` exports only NPC, Player, and Conditional nodes. It does not
explicitly handle storylet, storylet pool, or randomizer nodes introduced in the
newer narrative layer.

**Recommendation:** Define how these nodes map to Yarn (or explicitly state they
are not supported) to avoid silent content loss.

### 4.6 Type safety gaps in editor utilities

Some editor glue code (e.g. `ReactFlowNodeData` in
`reactflow-converter.ts`) uses `any` for `flagSchema`, which weakens type safety
in an otherwise strongly-typed architecture.

**Recommendation:** Replace `any` with the actual `FlagSchema` type or a shared
editor-specific interface.

## 5. Suggested cleanup priorities

1. **Documentation alignment:** Update README samples and API lists to match
   actual exports.
2. **CLI alignment:** Ensure `npx @magicborn/dialogue-forge` and the package
   contents reflect the real demo layout.
3. **Constant usage audit:** Remove remaining string literal checks for node and
   flag types.
4. **Storylet export policy:** Decide and document how storylets/randomizers are
   represented in Yarn (or document the limitation clearly).
5. **Type safety pass:** Replace remaining `any` typings where possible.

## 6. What to keep

Despite the confusion points above, the codebase has several strong areas:

- Clear separation between data models (`src/types`), core logic (`src/lib`),
  and UI (`src/components`).
- The `NarrativeWorkspace` unifies narrative structure with the dialogue graph
  editor, making it easier to scale beyond simple branching trees.
- The Yarn runner is decoupled enough to be tested and used in non-React
  contexts.

---

If you adopt the recommendations above, the project will feel more cohesive and
make its intended direction (dialogue + narrative tooling + runtime simulation)
much easier to understand for new contributors and users.
