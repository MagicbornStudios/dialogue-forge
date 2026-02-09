# Writer features and requirements

Single place for **what we need** from the Writer in the target codebase (e.g. forge-agent). Use this when scoping or implementing the Writer migration.

## Scope

Narrative prose workspace: acts/chapters/pages tree, Lexical-based editor, narrative graph sync, AI patch workflow, optional commenting, modals (e.g. Yarn). Writer is installed like other editors; data access via hooks only (no adapters). See [55-data-access-and-export.md](55-data-access-and-export.md).

## Feature list (requirements)

### Hierarchy and pages

- Act / Chapter / Page tree; create, rename, reorder, delete pages.
- Expand/collapse in tree; selection and active page.
- Pages listable by project; optionally by narrative graph for current product.

### Editor

- Lexical-based editing; serialized content (e.g. JSON) per page; title + body.
- Autosave (debounced) to persist title and content.

### Pages and blocks (Notion SDK shape)

- Use official Notion SDK Page/Block shape as the Writer data contract.
- Rebuild Writer page and block persistence to Notion-shaped structures.
- Remove `bookBody` and `content` as canonical Writer body fields.
- Keep Lexical serialized JSON where needed as block-level payload.
- Persist drag-and-drop block reorder as explicit block order operations.
- Design and task breakdown live in [63-writer-pages-blocks-and-reorder.md](63-writer-pages-blocks-and-reorder.md).

### Narrative graph sync

- One narrative graph per project (or selected); draft slice for graph edits.
- Commit creates pending pages and updates graph (pageId on nodes); hierarchy derived from graph + pages.
- No association between Writer pages and narrative graph nodes (decision per [32-plan-writer-and-pages.md](32-plan-writer-and-pages.md) and [40-ideas-and-concerns.md](40-ideas-and-concerns.md)).

### Data access

- Pages CRUD and list via **React Query hooks** (Payload or equivalent). No adapters; hooks only (see [55-data-access-and-export.md](55-data-access-and-export.md)).
- Narrative graph load/save via same backend and Forge graph hooks (useForgeGraphs, useForgeGraph, useCreateForgeGraph, useUpdateForgeGraph).

### AI patch workflow (WriterPatchOp)

- **Ops:** setTitle, replaceSelectedText, insertParagraphAfterBlock, replaceBlockText, deleteBlock (see [packages/writer/src/types/writer-ai-types.ts](../../../packages/writer/src/types/writer-ai-types.ts)).
- Proposal state: idle / loading / ready / error.
- Preview and apply in editor; CopilotKit or equivalent integration.

### Commenting (optional)

- List, create, update, delete comments per page; thread support. Optional for MVP.

### Modals and chrome

- Yarn modal (preview/export narrative).
- Project switcher; top bar; panel layout.

## Out of scope (for this migration doc)

- Edge-drop (see [11-out-of-scope.md](11-out-of-scope.md)).
- Linking Writer pages to narrative graph nodes (decision: no association; see 32, 40).

## Dependencies

- **Forge:** Graph types and hooks (narrative graph, createGraph, updateGraph) must be available or documented so Writer can depend on them.
- **Shared types:** ForgePage, PAGE_TYPE, NarrativeHierarchy (from shared/narrative).
- **Data access:** React Query + Payload (or equivalent) for pages and graph; no adapter contracts.
- **Pages and blocks migration:** Block model/reorder implementation depends on the data contracts and sequence in [63-writer-pages-blocks-and-reorder.md](63-writer-pages-blocks-and-reorder.md).

## References

- [21-writer-forge-inventory.md](21-writer-forge-inventory.md) — Inventory and current data flow.
- [32-plan-writer-and-pages.md](32-plan-writer-and-pages.md) — Notion vs narrative; Writer editor mapping.
- [55-data-access-and-export.md](55-data-access-and-export.md) — Data access (hooks, no adapters).
- [61-writer-current-implementation.md](61-writer-current-implementation.md) — How each area is implemented now.
