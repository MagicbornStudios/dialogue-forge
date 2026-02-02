---
name: Relationships collection and edit
overview: Remove the minimap; add a Payload Relationship collection linked to characters, create a relationship document when adding a link on the graph, and wire the relationship list so users can click Edit and save label/description to the collection and sync the label to the graph.
todos: []
---

# Relationships collection, link creation, and list edit

## Scope

1. **Remove minimap** — Delete [RelationshipGraphMinimap.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphMinimap.tsx) and its usage (graphPaper state + conditional render) in [RelationshipGraphEditorBlank.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphEditorBlank.tsx).
2. **New Relationship collection** — Payload collection with sourceCharacter, targetCharacter, label, description; linked to characters and project.
3. **Create relationship when creating a link** — When `addRelationshipFromActiveToCharacter` adds a link, also create a Relationship document via the adapter (so relationship data can be used elsewhere).
4. **Relationship list: edit label/description** — Wire [RelationshipsList](src/characters/components/CharacterWorkspace/components/CharacterSidebar/RelationshipsList.tsx) and [EdgeRow](src/characters/components/CharacterWorkspace/components/CharacterSidebar/EdgeRow.tsx) so clicking Edit lets the user edit label and description; save updates the Relationship document and syncs the label to the graph link (and persists graph JSON).

Graph JSON (relationshipGraphJson on Character) continues to work as today; we add a separate source of truth for label/description in the Relationship collection.

---

## 1. Remove minimap

- **Delete** [RelationshipGraphMinimap.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphMinimap.tsx).
- **Edit** [RelationshipGraphEditorBlank.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphEditorBlank.tsx): remove `RelationshipGraphMinimap` import, remove `graphPaper` state and `setGraphPaper`, remove the conditional render of `<RelationshipGraphMinimap ... />`, remove `setGraphPaper({ graph, paper })` and `setGraphPaper(null)` from the effect. Restore the outer wrapper to a single div (no sibling for minimap).

---

## 2. New Payload Relationship collection

- **Add** `PAYLOAD_COLLECTIONS.RELATIONSHIPS = 'relationships'` in [app/payload-collections/enums.ts](app/payload-collections/enums.ts).
- **New** [app/payload-collections/collection-configs/relationships.ts](app/payload-collections/collection-configs/relationships.ts):
- Slug: `relationships`.
- Fields: `project` (relationship to projects, required, index), `sourceCharacter` (relationship to characters, required), `targetCharacter` (relationship to characters, required), `label` (text, optional), `description` (textarea, optional).
- Access: same pattern as Characters (read/create/update/delete true for now).
- Optional: add a custom hook or validate to prevent duplicate (sourceCharacter, targetCharacter) per project.
- **Edit** [app/payload-collections/index.ts](app/payload-collections/index.ts): export Relationships.
- **Edit** [app/payload.config.ts](app/payload.config.ts): import and add `Relationships` to the collections array.
- **Generate types**: run Payload so `app/payload-types.ts` gets the new `Relationship` type (or add a minimal type for the new collection if the project uses a different flow).

---

## 3. Adapter and domain types for relationships

- **Types** in [src/characters/types/character.ts](src/characters/types/character.ts) (or a new `relationship.ts` re-exported from types index):
- `RelationshipDoc`: `{ id: string; project: string; sourceCharacter: string; targetCharacter: string; label?: string; description?: string }`.
- **Extend** [CharacterWorkspaceAdapter](src/characters/types/contracts.ts):
- `createRelationship(data: { projectId: string; sourceCharacterId: string; targetCharacterId: string; label?: string; description?: string }): Promise<RelationshipDoc>`
- `updateRelationship(relationshipId: string, patch: { label?: string; description?: string }): Promise<RelationshipDoc>`
- `listRelationshipsForProject(projectId: string): Promise<RelationshipDoc[]>` (or list by project so the list can match links to relationships by source+target).
- **Implement** in [app/lib/characters/payload-character-adapter.ts](app/lib/characters/payload-character-adapter.ts): implement the three methods using the Payload SDK and the new relationships collection; map Payload Relationship to RelationshipDoc.

---

## 4. Create relationship when creating a link

- **Editor ref** currently has no access to the adapter or projectId. Two options:
- **A)** Keep creation in the **parent**: in [CharacterWorkspace.tsx](src/characters/components/CharacterWorkspace/CharacterWorkspace.tsx), in `handleAddRelationship`, after calling `graphEditorRef.current?.addRelationshipFromActiveToCharacter?.(character)`, call `dataAdapter.createRelationship({ projectId: activeCharacter.project, sourceCharacterId: activeCharacterId, targetCharacterId: character.id, label: '', description: '' })`. This requires the adapter to be available in CharacterWorkspace (it already is via `dataAdapter`).
- **B)** Pass a callback from the parent into the graph editor, e.g. `onRelationshipCreated?: (sourceCharacterId, targetCharacterId) => void`, and the parent creates the relationship in that callback.
- **Recommendation**: Option A — keep adapter usage in CharacterWorkspace; after `addRelationshipFromActiveToCharacter` returns, call `dataAdapter.createRelationship(...)` with the same source/target. If the adapter call fails, we could leave the link as-is (orphan link) or remove it; for simplicity, leave as-is and show "No label" until the user edits (and we can upsert relationship on first edit if desired).
- **Idempotency**: Before creating, the parent can call `listRelationshipsForProject`, find one with same sourceCharacter + targetCharacter, and skip create if it exists; or the API can enforce uniqueness and return existing.

---

## 5. Relationship list: data source and edit flow

- **Data**: RelationshipsList currently gets links from `graphEditorRef.current?.getGraph()?.getLinks()` and filters by active character. For each link we need label/description: **look up** the Relationship doc by (sourceCharacterId, targetCharacterId) derived from the link (link id is `character-{sourceId}->character-{targetId}`; strip prefix to get character ids). So:
- Parent (CharacterWorkspace) loads relationships for the project: `listRelationshipsForProject(activeProjectId)` and passes them down (e.g. `relationships: RelationshipDoc[]`) to the sidebar or to RelationshipsList.
- RelationshipsList receives `relationships`, `graphEditorRef`, `characters`, `activeCharacterId`. For each link (filtered by active), compute sourceCharacterId and targetCharacterId from link; find `relationships.find(r => r.sourceCharacter === sourceId && r.targetCharacter === targetId)`; pass that doc’s label/description into EdgeRow as the displayed and initial edit values.
- **Edit state**: Lift editing state to the parent or keep in RelationshipsList: e.g. `editingRelationshipId: string | null` (or editing link id). When user clicks Edit on an EdgeRow, set `editingRelationshipId` to that relationship’s id (or link id). EdgeRow in edit mode shows Input (label), Textarea (description), Save / Cancel / Delete.
- **Save**: On Save, call `dataAdapter.updateRelationship(relationshipId, { label, description })`. Then update the **link’s label** on the graph so the graph JSON reflects it: add a method on the graph editor ref, e.g. `updateLinkLabel(linkId: string, label: string)`, which gets the link by id, updates its labels (using the same pattern as [relationshipLink.ts](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/links/relationshipLink.ts) `link.labels([...])`), and calls `onGraphChange(graph.toJSON())`. Parent’s `onGraphChange` already sets `currentGraphJson`; user can click “Save graph” to persist to the character, or you can auto-save after updating the link.
- **Delete**: On Delete, remove the link from the graph (graph.removeCell(link)) and call `onGraphChange(graph.toJSON())`; optionally call adapter `deleteRelationship(relationshipId)` if you add that method. Relationship collection can have a `deleteRelationship` in the adapter.
- **Create relationship on first edit**: If a link has no Relationship doc yet (e.g. created before this feature), on first Edit/Save create the relationship via `createRelationship` with the link’s source/target and the entered label/description, then update the link label as above.

---

## 6. Graph editor ref: updateLinkLabel

- **Edit** [RelationshipGraphEditorBlank types](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/types.ts): add `updateLinkLabel?(linkId: string, label: string): void` to the ref interface.
- **Edit** [RelationshipGraphEditorBlank.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphEditorBlank.tsx): in `useImperativeHandle`, implement `updateLinkLabel(linkId, label)`: get graph, get link by id, set labels (same as createRelationshipLink with options.label), call `onGraphChangeRef.current?.(graph.toJSON())`.

---

## 7. Wire RelationshipsList and CharacterWorkspace

- **CharacterWorkspace**: Load relationships when project or characters change: `useEffect` that calls `dataAdapter.listRelationshipsForProject(activeProjectId)` and stores in state (e.g. `relationships: RelationshipDoc[]`). Pass `relationships`, `dataAdapter`, and a save handler (or let RelationshipsList receive adapter and projectId) to the sidebar. Pass `graphEditorRef` and a way to refresh graph JSON after update (already have `onGraphChange` and `setCurrentGraphJson`).
- **RelationshipsList**: Accept `relationships`, `dataAdapter`, `activeProjectId`, `activeCharacter`, `graphEditorRef`, `onGraphChange` (or ref to get graph and trigger save). For each link for the active character, find the matching RelationshipDoc; pass to EdgeRow with `relationshipId`, `label`, `description`, and handlers: `onEdit` (set editing), `onSave` (updateRelationship + updateLinkLabel + clear editing), `onCancel`, `onDelete` (remove link from graph, optionally deleteRelationship).
- **EdgeRow**: Already has the UI; ensure it receives real `editLabel`, `editWhy` (description), `onEditLabel`, `onEditWhy`, `onEdit`, `onSave`, `onCancel`, `onDelete` from RelationshipsList. Add `relationshipId` if needed for save.

---

## 8. RelationshipFlowEdge type

- EdgeRow imports `RelationshipFlowEdge` from `@/characters/types`; that type is not defined in the repo. **Define** it (e.g. in [character.ts](src/characters/types/character.ts) or contracts): `{ id: string; source: string; target: string; data?: { label?: string; why?: string }; relationshipId?: string }` so the list can pass relationship id for save.

---

## File summary

| # | Action | File |
|---|--------|------|
| 1 | Remove minimap | Delete RelationshipGraphMinimap.tsx; edit RelationshipGraphEditorBlank.tsx (remove graphPaper, Minimap render) |
| 2 | Add Relationship collection | enums.ts; new relationships.ts config; index + payload.config |
| 3 | Adapter + types | character.ts or relationship.ts (RelationshipDoc, RelationshipFlowEdge); contracts.ts (createRelationship, updateRelationship, listRelationshipsForProject); payload-character-adapter.ts (implement) |
| 4 | Create relationship on link add | CharacterWorkspace.tsx handleAddRelationship: after addRelationshipFromActiveToCharacter, call dataAdapter.createRelationship(...) |
| 5 | updateLinkLabel on ref | types.ts (ref interface); RelationshipGraphEditorBlank.tsx (implement updateLinkLabel) |
| 6 | List + edit flow | CharacterWorkspace: load relationships, pass to sidebar; RelationshipsList: merge links + relationships, wire EdgeRow edit/save/delete; optional deleteRelationship on adapter |

---

## Optional

- **Uniqueness**: In Relationships collection, add a beforeChange hook or unique index so (project, sourceCharacter, targetCharacter) is unique.
- **Delete relationship**: Add `deleteRelationship(relationshipId)` to the adapter and call it when the user deletes from the list (and remove the link from the graph).
- **Sync label from Relationship to graph on load**: When loading the graph from JSON, after syncGraphElementsWithCharacters, for each link get the matching Relationship doc and set the link’s label so the graph displays it (optional; otherwise label is only set when user edits).