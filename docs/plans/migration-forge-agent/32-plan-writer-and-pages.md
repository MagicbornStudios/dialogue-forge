# Plan: Writer and pages

Map Writer workspace to forge-agent’s Writer editor or Notion-style Writer mode. Writer uses Notion-style pages with branching; **no association** between Writer pages and the narrative graph.

## Context

- dialogue-forge: WriterWorkspace with acts/chapters/pages tree, Lexical editor, WriterDataAdapter (pages CRUD), WriterForgeDataAdapter (narrative graph load/save). Draft slice creates pages on commit and updates narrative graph.
- forge-agent: PageDoc, BlockDoc, PageParent, BlockParent in packages/types/src/page.ts (Notion-inspired; no Notion SDK). Writer mode uses these for prose. Narrative graph in DialogueEditor has only Page, Detour, Jump nodes (structure-only) and is **not** linked to Writer PageDocs.

## Steps

### 1. Map Writer workspace to Writer editor (forge-agent)

- Define “Writer editor” surface: tree (or list) of pages, main editor pane, top bar, project switcher. Use EditorShell + DockLayout pattern like DialogueEditor; data-domain for theming.
- Writer editor is installed like other editors in forge-agent (e.g. DialogueEditor). Writer needs **branching**: different directions, multi-user, agent mass edits. Document the chosen model (standalone tab vs mode inside shared app shell).

### 2. Writer pages: no link to narrative graph

- **Decision:** No association between Writer pages (Notion-style PageDoc/BlockDoc) and narrative graph. Writer is fully Notion-style; narrative graph nodes (Page, Detour, Jump) are structure-only and do not have pageId links to PageDoc.
- listPages (or equivalent) in forge-agent is not scoped by narrative graph; Writer tree is driven by Notion hierarchy (PageParent: workspace, page_id, block_id, database_id). Commit creates/updates PageDocs; narrative graph is separate.

### 3. Lexical editor and AI patch (WriterPatchOp)

- If Writer editor is ported, port Lexical editor surface and plugins (e.g. DraggableBlockPlugin) and the AI patch workflow: WriterPatchOp (replace, splice, replace-block), proposal state, apply/preview in editor. CopilotKit integration in forge-agent may already support similar patterns; align with existing copilot/workflow APIs.

### 4. Adapters

- WriterDataAdapter equivalent: createPage, updatePage, list pages (by project / parent). Implement in forge-agent host (e.g. Payload collections for pages). No listPages by narrative graph.
- WriterForgeDataAdapter equivalent (if Writer needs to reference narrative): getGraph (narrative), createGraph, updateGraph. Narrative graph is separate from Writer pages; no pageId on narrative nodes.

## Done

- (None yet.)

## Next

1. Implement Writer editor shell (layout, tree, editor pane) in forge-agent (slice 1).
2. Port Lexical editor and AI patch workflow if scope includes Writer (slice 2).
3. Implement Writer adapters (createPage, updatePage, list pages by parent) in forge-agent host (slice 3).
4. Add branching support (directions, multi-user, agent mass edits) for Writer content (slice 4).
