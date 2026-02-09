# Writer pages and blocks: Notion SDK, rebuilt schema, and block reorder

Design and execution roadmap for migrating Writer page storage from a single page blob to Notion-shaped pages and blocks, with persisted drag-and-drop block order.

## Scope and goals

- Use official Notion SDK types and object shapes (Page and Block) as the source contract.
- Rebuild Writer persistence to Notion-shaped page and block records.
- Remove `bookBody` and `content` as canonical page body fields.
- Keep Lexical serialized JSON where appropriate at block level.
- Persist block reorder operations as first-class data operations.
- Keep this doc as the single "what's next" task list for this slice.

## Current state (summary)

- Page content is stored as a single blob on `pages` (`bookBody`, with optional `content` usage), not as first-class blocks.
- Autosave serializes the entire Lexical editor and writes whole-page content each save.
- `DraggableBlockPlugin` reorders blocks in editor state, but persistence remains implicit through full autosave.
- No block-level backend entity, block CRUD, or block-level versioning contract.
- Versions are page-level only (Payload page drafts), not per block.

Reference pointers:

- [packages/shared/src/types/narrative.ts](../../../../packages/shared/src/types/narrative.ts)
- [apps/studio/payload/collections/collection-configs/pages.ts](../../../../apps/studio/payload/collections/collection-configs/pages.ts)
- [packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/AutosavePlugin.tsx](../../../../packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/AutosavePlugin.tsx)
- [packages/writer/src/components/WriterWorkspace/store/slices/editor.slice.ts](../../../../packages/writer/src/components/WriterWorkspace/store/slices/editor.slice.ts)
- [packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/DraggableBlockPlugin/index.tsx](../../../../packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/DraggableBlockPlugin/index.tsx)

## Target state

- Writer pages and blocks follow Notion SDK shape and terminology.
- Pages hold metadata and hierarchy context; blocks hold ordered content.
- Block records include stable id, type, parent, `has_children`, and type payload.
- Lexical serialized JSON is stored per block where needed for rich editor fidelity.
- Drag-and-drop reorder persists as explicit block order updates (children order).
- `bookBody` and `content` are removed from active Writer persistence paths.

## Design and tech stack

### Notion SDK usage

- Add Notion SDK dependency for type contracts and shape alignment.
- Use Notion Page and Block object structure as canonical model for Writer docs.
- This slice does not require using Notion cloud API as storage backend; Payload remains backend with Notion-shaped schema.

### Data model

- Pages collection: Notion page-like metadata and parent relation shape.
- Blocks collection: one record per block with `id`, `pageId`, `parentBlockId`, `type`, `has_children`, `order`, `archived`, `inTrash`, and type-specific payload.
- For rich text/editor payloads, store Lexical serialized JSON in a block field designed for block content payload.
- Reorder authority is block children order, not page blob order.

### Block text over time (history/versioning)

- Options tracked: per-block `contentHistory`, separate `block_versions` keyed by block id/version, or defer history initially.
- Recommended default: defer deep history for MVP, then add a dedicated `block_versions` collection in a follow-on slice.

### Lexical and block sync

- Hydrate path: query ordered blocks by page, build Lexical state from blocks, mount editor with that state.
- Persist path (MVP): Lexical state to normalized block list, diff against current blocks, then create/update/delete via block APIs.
- Reorder persists via dedicated reorder API on drop completion.

### Reorder contract

- Preferred API shape: `reorderBlocks(pageId, blockIdsInOrder)` for root-level reorder, with optional nested reorder keyed by `parentBlockId`.
- UI flow: drop completes, compute new order, optimistic update, persist reorder, rollback/refetch on failure.

## Open decisions

1. Notion API backend vs Payload-only backend with Notion-shaped schema.
2. Exact field for Lexical serialized JSON in each block type payload.
3. Full-doc diff vs incremental block operation stream as long-term persistence strategy.

## Implementation location

- Implement this migration in `dialogue-forge` first (consumer playground), then upstream stable patterns to `forge-agent`.
- Keep this doc updated with Done/Next so implementation slices are traceable.

## Roadmap and task breakdown

### Task 1: Notion SDK and rebuilt collections

- Add Notion SDK dependency and document adopted Page/Block contracts.
- Rebuild page and block schema to Notion shape.
- Remove `bookBody` and `content` from active schema paths.
- Completion: schema/types compile and docs reflect final field contracts.

### Task 2: Block CRUD and list APIs

- Implement data operations and hooks: `listBlocks(pageId)`, `createBlock`, `updateBlock`, `deleteBlock`, `reorderBlocks(pageId, blockIdsInOrder)`.
- Completion: hook/API tests cover CRUD and reorder contracts.

### Task 3: Lexical hydrate from blocks

- Build Lexical initial state from ordered blocks.
- Ensure supported block types render with correct order and nesting.
- Completion: editor loads from block records without page-blob fallback.

### Task 4: Lexical serialize to blocks and persist

- Convert Lexical state to block list and persist via diffed block operations.
- Remove runtime reliance on whole-page body writes.
- Completion: save path produces block mutations only.

### Task 5: Block text-at-time strategy

- Implement chosen history/versioning model (recommended: `block_versions` collection).
- Completion: block history read/write API is defined and tested.

### Task 6: Drag-and-drop reorder persistence

- Wire drop completion to reorder API.
- Keep editor, local cache, and backend order in sync.
- Completion: reorder persists across refreshes and collaborators.

### Task 7: Optional data migration

- One-time conversion for existing `bookBody` pages to Notion-shaped blocks.
- Remove deprecated fields from code paths after migration.
- Completion: migration script and rollback notes are documented.

## Done

- Added docs-only design and roadmap for Notion SDK page/block migration and block reorder persistence.
- Added non-breaking schema+API foundation in `dialogue-forge`:
  - Studio Payload `blocks` collection wiring.
  - Writer block contract/mappers and fallback read resolver.
  - Writer block query + mutation hooks (`list/create/update/delete/reorder`) and `useWriterResolvedPageContent`.

## Next recommended task

1. Task 3: Lexical hydrate from blocks.
