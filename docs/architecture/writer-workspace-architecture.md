# Writer Workspace Architecture

Writer is the narrative prose workspace for acts, chapters, and pages, backed by a narrative Forge graph.

## Role

- Organize structure as pages (`ACT`, `CHAPTER`, `PAGE`).
- Edit prose with Lexical-based editor flows.
- Sync structure and narrative graph explicitly through store actions and commit helpers.
- Support AI patch workflows (`WriterPatchOp`) with preview/apply.

## Data Access Model

Writer no longer uses host-provided adapter contracts.

- Host provides providers only:
  - `QueryClientProvider`
  - `ForgePayloadProvider`
- Writer data hooks live in `packages/writer/src/data/writer-queries.ts`.
- Writer imports Forge graph hooks/helpers from `@magicborn/forge` for narrative graph reads and mutations.
- `WriterWorkspace` builds runtime callbacks from hook mutations and passes those callbacks into the store.

## Store

Location: `packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx`.

Slices:
- `content` for pages and page map
- `navigation` for active page and tree expansion
- `editor` for save and editor errors
- `ai` for proposal state and preview metadata
- `draft` for narrative graph draft and pending page creations
- `viewState` for modal and panel visibility

Mutations are explicit actions; there is no adapter-in-context pattern.

## Graph Commit Flow

- `buildOnCommitWriterDraft(api)` takes a small API object:
  - `createPage(...)`
  - `updateGraph(...)`
- Commit creates pending pages first, patches graph node `pageId` mappings, then persists graph updates.
- `createNarrativeGraph(api, projectId)` similarly takes a narrow create-graph API.

## Loading Flow

- `WriterWorkspace` queries narrative graphs with `useForgeGraphs(projectId, NARRATIVE)`.
- `WriterWorkspace` queries project metadata with `useForgeProject(projectId)`.
- `WriterWorkspaceContent` queries pages with `useWriterPages(projectId, selectedNarrativeGraphId)`.
- Store actions hydrate UI state from query results.

## UI Structure

- `WriterLayout` composes sidebar and editor panes.
- `WriterTree` handles hierarchy operations and page CRUD mutations.
- `WriterEditorPane` handles Lexical editing and page updates.
- Comment flows use writer comment hooks directly from `writer-queries`.
- `WriterWorkspaceModalsRenderer` renders workspace modals.

## Key Files

- `packages/writer/src/components/WriterWorkspace/WriterWorkspace.tsx`
- `packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx`
- `packages/writer/src/components/WriterWorkspace/store/slices/subscriptions.ts`
- `packages/writer/src/components/WriterWorkspace/sidebar/WriterTree.tsx`
- `packages/writer/src/components/WriterWorkspace/editor/WriterEditorPane.tsx`
- `packages/writer/src/data/writer-queries.ts`

## Invariants

- Do not reintroduce `WriterDataAdapter` or `WriterForgeDataAdapter`.
- Keep data queries and mutations in package hooks.
- Keep Writer dependent on Forge data hooks and types only, not Forge UI/store internals.
