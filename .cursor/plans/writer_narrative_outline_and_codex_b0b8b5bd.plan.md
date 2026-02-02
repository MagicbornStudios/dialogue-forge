---
name: Writer narrative outline and Codex
overview: Make the narrative outline rigid (no rename, system names only; collapsible acts/chapters/pages), add a Codex section in the writer sidebar for ad-hoc project pages with user-defined names and Notion-like reordering and reparenting, and extend the data model to support codex pages.
todos: []
isProject: false
---

# Writer: Rigid Narrative Outline + Codex Section

## 1. Goal

- **Narrative outline**: Acts, chapters, and pages stay **rigid and structured**. Names are **system-created only** (e.g. "Act I", "Chapter 1", "Page 1"); **no rename** for these items. Support **collapsible** acts, chapters, and pages.
- **Codex**: A **second section** in the writer sidebar for **other project pages** — ad-hoc, user-named, user-organized. **Notion-like** behavior: create pages and children, create siblings, **reorder** and **reparent** (move children to another parent, move a child from one page to another). Codex pages = whatever the user wants; narrative outline = fixed structure.

---

## 2. Current State

- **Writer tree** ([WriterTree.tsx](src/writer/components/WriterWorkspace/sidebar/WriterTree.tsx)): Single "NARRATIVE OUTLINE" section. Pages are filtered by `selectedNarrativeGraphId` and built via [buildNarrativeHierarchy](src/shared/types/narrative.ts) (act → chapter → page). Uses [react-arborist](https://www.npmjs.com/package/react-arborist) `Tree` with `openByDefault={true}` (no per-node collapse state). `handleRenamePage` and `handleDeletePage` exist but are **not** passed to [WriterTreeRow](src/writer/components/WriterWorkspace/sidebar/WriterTreeRow.tsx) — so rename/delete are not currently exposed in the row UI.
- **Pages collection** ([pages.ts](app/payload-collections/collection-configs/pages.ts)): `pageType` is required and is `ACT | CHAPTER | PAGE`. `narrativeGraph` is optional. `parent` and `order` exist for hierarchy.
- **Writer adapter** ([writer-adapter.ts](src/writer/lib/data-adapter/writer-adapter.ts), [payload-writer-adapter.ts](app/lib/writer/data-adapter/payload-writer-adapter.ts)): `listPages(projectId, narrativeGraphId?)` — when `narrativeGraphId` is omitted, the current implementation does **not** filter by `narrativeGraph`, so it returns all project pages. To support Codex we need: narrative outline = pages where `narrativeGraph` equals the selected graph; codex = pages where `narrativeGraph` is null (and optionally a dedicated pageType).
- **Store**: [navigation.slice](src/writer/components/WriterWorkspace/store/slices/navigation.slice.ts) already has `expandedPageIds`; it can be used (or extended) for narrative-outline collapse state.

---

## 3. Data Model: Codex Pages

- **Option A (recommended)**: Add `pageType: 'CODEX'` to the Pages collection. Codex pages: `pageType: 'CODEX'`, `narrativeGraph: null`, `parent` (optional; another page id, any codex or same), `order`, `title` (user-defined). Narrative outline pages: `pageType` in ACT/CHAPTER/PAGE, `narrativeGraph` set.
- **Option B**: No new pageType; treat "codex" as "pages for this project with `narrativeGraph` null". Then we must allow `pageType` to be optional or add a value like "CODEX" so that non-narrative pages have a valid type.

**Recommendation**: Add **CODEX** to the `pageType` options in the Pages collection and in shared/forge types. Codex pages use `narrativeGraph: null`, `pageType: 'CODEX'`, and the same `parent`/`order` for tree structure.

- **List narrative outline**: `listPages(projectId, selectedNarrativeGraphId)` — only pages where `narrativeGraph` equals that id (existing behavior; ensure adapter uses `where.narrativeGraph = { equals: narrativeGraphId }` when id is non-null).
- **List codex**: `listPages(projectId, null)` with adapter semantics "return pages where `narrativeGraph` is null" (and optionally `pageType === 'CODEX'`). So adapter: when `narrativeGraphId === null`, set `where.narrativeGraph = { equals: null }` (and optionally `where.pageType = { equals: 'CODEX' }` if we add CODEX).

---

## 4. Narrative Outline: No Rename + Collapsible

- **Disable rename for narrative outline**: In [WriterTree.tsx](src/writer/components/WriterWorkspace/sidebar/WriterTree.tsx), do **not** expose rename for act/chapter/page. If/when you add a context menu or inline rename to [WriterTreeRow](src/writer/components/WriterWorkspace/sidebar/WriterTreeRow.tsx), pass a prop e.g. `canRename={false}` for narrative outline rows (or only pass `onRename` for Codex). So: narrative outline rows get `canRename={false}` (or no `onRename`); Codex rows get `canRename={true}` and `onRename`.
- **System names only**: Creation already uses system names ("Act I", "Chapter 1", "Page 1"). Ensure no other code path allows editing title for narrative outline pages (e.g. in [WriterEditorPane](src/writer/components/WriterWorkspace/editor/WriterEditorPane.tsx), if the active page is an act/chapter/page in the narrative outline, you could hide or disable the title input — optional and product decision).
- **Collapsible acts/chapters/pages**: Use [react-arborist](https://www.npmjs.com/package/react-arborist) controlled open state:
  - Add `isOpen` (or equivalent) to the tree node data for narrative outline, driven by store (e.g. `expandedPageIds` in [navigation.slice](src/writer/components/WriterWorkspace/store/slices/navigation.slice.ts)).
  - Use the Tree’s **controlled** API: pass initial `data` with `isOpen` per node, and an `onToggle` handler that updates `expandedPageIds` (toggle the node’s page id in the set). So: narrative outline tree data includes `isOpen: expandedPageIds.has(page.id)` (or default true), and on toggle you call `togglePageExpanded(page.id)`.

---

## 5. Codex Section: New Sidebar Block + Notion-like Tree

- **New section "Codex"** in [WriterTree.tsx](src/writer/components/WriterWorkspace/sidebar/WriterTree.tsx) (or a wrapper component that contains both Narrative Outline and Codex): a second heading "CODEX" and a second tree below the narrative outline tree. Codex shows only codex pages for the current project.
- **Data**: Load codex pages via `listPages(projectId, null)` with adapter semantics for "narrativeGraph null" (and optionally pageType CODEX). Build a **generic parent/order tree** (not act/chapter/page): root nodes = pages with `parent === null`, children = pages where `parent === that page id`, ordered by `order`. Helper: e.g. `buildTreeFromParentOrder(pages)` in shared or writer utils.
- **Create**: "New page" (and "New subpage" under a node) creates a codex page: `pageType: 'CODEX'`, `narrativeGraph: null`, `parent` (optional), `order`, `title` (e.g. "Untitled" or user-entered).
- **Rename**: Codex rows get rename (context menu or inline): call adapter `updatePage(id, { title })` and update local state.
- **Delete**: Codex rows get delete (with "delete children first" or cascade rule as you define).
- **Reorder / Reparent (Notion-like)**: Use react-arborist’s **drag-and-drop** (if supported) or custom DnD to:
  - Move a node to a new parent (update `parent` and `order`).
  - Move a node to a new position among siblings (update `order`).
  - After drop, call adapter `updatePage(id, { parent, order })` (and optionally reorder siblings). Persist and refetch or update local state so the tree stays in sync.

Implement drag-and-drop in the Codex tree and persist `parent` + `order` on drop; narrative outline tree can remain non-draggable (or drag disabled) to keep structure rigid.

---

## 6. Writer Store and Adapter

- **Store**: Hold both narrative outline pages and codex pages, or derive one from the other. Easiest: keep `pages` as "current narrative graph’s pages" for the outline, and add e.g. `codexPages: ForgePage[]` (or a separate list) loaded when project is selected, and updated after create/update/delete/reorder in Codex. Alternatively, a single `pages` list that is the union and split by narrativeGraph in the UI — product choice.
- **Adapter**:
  - **listPages(projectId, narrativeGraphId)**: When `narrativeGraphId != null`, filter `where.narrativeGraph = { equals: narrativeGraphId }`. When `narrativeGraphId === null`, filter `where.narrativeGraph = { equals: null }` (and optionally `pageType: 'CODEX'`) so codex listing is explicit.
  - **createPage**: Allow `pageType: 'CODEX'` and `narrativeGraph: null` for codex pages; require `narrativeGraph` for ACT/CHAPTER/PAGE.
- **Types**: Extend [ForgePage](src/shared/types/narrative.ts) (or writer-specific type) and [PAGE_TYPE](src/shared/types/narrative.ts) to include `CODEX`. Update [buildNarrativeHierarchy](src/shared/types/narrative.ts) to ignore CODEX pages (or keep it act/chapter/page only). Add a small `buildCodexTree(pages: ForgePage[])` (or equivalent) that builds a tree from `parent`/`order` for codex only.

---

## 7. UI Layout (Sidebar)

- **Order**: Narrative Graph selector + NARRATIVE OUTLINE (collapsible tree) first; then **CODEX** (heading + codex tree). Both sections scroll if needed.
- **Selection**: Clicking a narrative outline page or a codex page sets the same `activePageId` and opens that page in the editor; the editor does not need to know whether the page is narrative or codex except possibly to hide title edit for narrative outline (optional).

---

## 8. File and Code Touchpoints


| Area                     | File(s)                                                                                                                                                           | Changes                                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page type                | [app/payload-collections/collection-configs/pages.ts](app/payload-collections/collection-configs/pages.ts)                                                        | Add `CODEX` to `pageType` options.                                                                                                                    |
| Types                    | [src/shared/types/narrative.ts](src/shared/types/narrative.ts)                                                                                                    | Add `PAGE_TYPE.CODEX`, extend `PageType` and `ForgePage`; add `buildCodexTree(pages)` (or in writer utils) for parent/order tree.                     |
| Adapter                  | [app/lib/writer/data-adapter/payload-writer-adapter.ts](app/lib/writer/data-adapter/payload-writer-adapter.ts)                                                    | When `narrativeGraphId === null`, set `where.narrativeGraph = { equals: null }`; support `pageType: 'CODEX'` in create.                               |
| Writer adapter interface | [src/writer/lib/data-adapter/writer-adapter.ts](src/writer/lib/data-adapter/writer-adapter.ts)                                                                    | Allow `pageType: 'ACT'                                                                                                                                |
| Narrative outline        | [WriterTree.tsx](src/writer/components/WriterWorkspace/sidebar/WriterTree.tsx)                                                                                    | No rename for act/chapter/page (don’t pass onRename for outline rows). Add `isOpen`/`onToggle` and wire to `expandedPageIds` for collapse.            |
| Codex section            | [WriterTree.tsx](src/writer/components/WriterWorkspace/sidebar/WriterTree.tsx) or new component                                                                   | New "Codex" block; load codex pages; second tree with create/rename/delete/reorder/reparent; persist parent/order on drop.                            |
| Row                      | [WriterTreeRow.tsx](src/writer/components/WriterWorkspace/sidebar/WriterTreeRow.tsx)                                                                              | Optional: add `canRename`, `onRename`, `onDelete` props; show rename/delete only when allowed (e.g. Codex).                                           |
| Store                    | [writer-workspace-store](src/writer/components/WriterWorkspace/store), [navigation.slice](src/writer/components/WriterWorkspace/store/slices/navigation.slice.ts) | Optional: ensure `expandedPageIds` (or equivalent) is used for narrative outline open state; add codex pages state if not derived from a single list. |


---

## 9. Summary

- **Narrative outline**: Rigid; system names only; **no rename**; **collapsible** via `expandedPageIds` + react-arborist `isOpen`/`onToggle`.
- **Codex**: New sidebar section; codex pages = `pageType: 'CODEX'`, `narrativeGraph: null`, user-defined names and **Notion-like** reorder/reparent; adapter and types extended; second tree with create/rename/delete and DnD for parent/order updates.

