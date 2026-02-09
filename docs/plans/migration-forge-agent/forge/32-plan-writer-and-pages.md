# Plan: Writer and pages

Map Writer workspace to forge-agent’s Writer editor or Notion-style Writer mode. Writer uses Notion-style pages with branching; **no association** between Writer pages and the narrative graph.

## Context

- dialogue-forge: WriterWorkspace with acts/chapters/pages tree, Lexical editor; pages CRUD and narrative graph load/save via **hooks** (no adapters). Draft slice creates pages on commit and updates narrative graph. See [21-writer-forge-inventory.md](21-writer-forge-inventory.md) and [61-writer-current-implementation.md](../writer/61-writer-current-implementation.md).
- forge-agent: PageDoc, BlockDoc, PageParent, BlockParent in packages/types/src/page.ts (Notion-inspired; no Notion SDK). Writer mode uses these for prose. Narrative graph in DialogueEditor has only Page, Detour, Jump nodes (structure-only) and is **not** linked to Writer PageDocs.

## Features checklist

For a full list of Writer features and requirements (hierarchy, editor, narrative graph sync, AI patch, commenting, modals), see [60-writer-features-and-requirements.md](../writer/60-writer-features-and-requirements.md).

## Steps

### 1. Map Writer workspace to Writer editor (forge-agent)

- Define “Writer editor” surface: tree (or list) of pages, main editor pane, top bar, project switcher. Use EditorShell + DockLayout pattern like DialogueEditor; data-domain for theming.
- Writer editor is installed like other editors in forge-agent (e.g. DialogueEditor). Writer needs **branching**: different directions, multi-user, agent mass edits. Document the chosen model (standalone tab vs mode inside shared app shell).

### 2. Writer pages: no link to narrative graph

- **Decision:** No association between Writer pages (Notion-style PageDoc/BlockDoc) and narrative graph. Writer is fully Notion-style; narrative graph nodes (Page, Detour, Jump) are structure-only and do not have pageId links to PageDoc.
- Notion SDK alignment, rebuilt page/block schema (without `bookBody`/`content`), and persisted block reorder design are tracked in [63-writer-pages-blocks-and-reorder.md](../writer/63-writer-pages-blocks-and-reorder.md).
- listPages (or equivalent) in forge-agent is not scoped by narrative graph; Writer tree is driven by Notion hierarchy (PageParent: workspace, page_id, block_id, database_id). Commit creates/updates PageDocs; narrative graph is separate.

### 3. Lexical editor and AI patch (WriterPatchOp)

- If Writer editor is ported, port Lexical editor surface and plugins (e.g. DraggableBlockPlugin) and the AI patch workflow: WriterPatchOp (replace, splice, replace-block), proposal state, apply/preview in editor. CopilotKit integration in forge-agent may already support similar patterns; align with existing copilot/workflow APIs.

### 4. Data access (hooks, no adapters)

- Pages: createPage, updatePage, list pages (by project / parent) via React Query hooks that call Payload (or equivalent). No listPages by narrative graph. See [55-data-access-and-export.md](55-data-access-and-export.md).
- Narrative graph (if Writer needs it): getGraph (narrative), createGraph, updateGraph via Forge hooks. Narrative graph is separate from Writer pages; no pageId on narrative nodes.

## Done

- (None yet.)

## Next

1. Implement Writer editor shell (layout, tree, editor pane) in forge-agent (slice 1).
2. Port Lexical editor and AI patch workflow if scope includes Writer (slice 2).
3. Implement Writer adapters (createPage, updatePage, list pages by parent) in forge-agent host (slice 3).
4. Add branching support (directions, multi-user, agent mass edits) for Writer content (slice 4).
