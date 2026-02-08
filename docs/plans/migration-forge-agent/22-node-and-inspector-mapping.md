# Node and inspector mapping

How NodeEditor / NodeEditorFields in dialogue-forge map to forge-agent’s selection-driven InspectorSection model. For agents implementing plan 31.

## Forge-agent today

- **Selection:** Entity or non-entity; for nodes, typically `{ entityType: 'forge.node', id: nodeId }` (or similar).
- **InspectorSection:** `{ id, title, when(selection), render({ selection }) }`. When `when(selection)` is true, the section is shown and `render` gets the selection.
- **forgeInspectorSections:** Returns an array of sections; one “forge.node” section that finds the node in `graph.flow.nodes` and renders a single **NodeFields** component (generic: label, content, speaker).
- **WorkspaceInspector:** Receives `selection` and `sections`; filters sections by `when(selection)` and renders each section’s title + render output.

## Dialogue-forge today

- **NodeEditor:** Receives selected node id; loads node from graph; renders NodeEditorHeader, NodeEditorIdField, runtime directives, set-flags, NextNodeSelector, and **NodeEditorFields**.
- **NodeEditorFields:** Single component that switches on `node.type` and renders one of: ActNodeFields, ChapterNodeFields, PageNodeFields, CharacterNodeFields, PlayerNodeFields, ConditionalNodeFields, StoryletNodeFields, DetourNodeFields. Each has different props (flagSchema, characters, conditionInputs, choiceInputs, onUpdateStoryletCall, listPages/pages, etc.).

## Mapping options

### Option A: One section “forge.node” with dispatch by type

- Single InspectorSection with `when: (s) => isEntity(s) && s.entityType === 'forge.node'`.
- In `render`, find node in graph; switch on `node.data.type` (or node.type) and render the appropriate *NodeFields component (CharacterNodeFields, PlayerNodeFields, etc.). Same pattern as NodeEditorFields.
- **Pros:** One section; simple. **Cons:** One large component or many imports in one file; needs flagSchema, characters, listPages passed in (e.g. via closure or context).

### Option B: One section per node type

- Multiple sections: “forge.node.character”, “forge.node.player”, … each with `when: (s) => isEntity(s) && s.entityType === 'forge.node' && nodeType(s) === 'CHARACTER'` (etc.).
- Each section’s render uses only the matching *NodeFields component.
- **Pros:** Clear separation; smaller render functions. **Cons:** More sections; need to resolve node type from selection (fetch node from graph in when/render).

### Recommendation

Start with **Option A** (one section, dispatch by type) to mirror dialogue-forge’s NodeEditorFields and avoid N section registrations. If the file grows too large, split by domain node “family” (narrative: Act/Chapter/Page; dialogue: Character/Player/Conditional/Storylet/Detour) or move to Option B.

## Data shape

- **dialogue-forge ForgeNode:** id, type, label, speaker, characterId, content, setFlags, choices, conditionalBlocks, storyletCall, actId, chapterId, pageId, defaultNextNodeId, presentation, runtimeDirectives. Types from packages/shared/src/types/forge-graph.ts.
- **forge-agent ForgeNode (current):** id, type, label, speaker, content, choices (minimal). In packages/types/src/graph.ts. Must be extended (plan 30) to include conditionalBlocks, storyletCall, actId, chapterId, pageId, etc., so that *NodeFields components can be ported with minimal change.

## Shared pieces to port

- **FlagSelector** — Used in Player, Conditional, and set-flags in NodeEditor. Needs flagSchema from adapter/context.
- **CharacterSelector** — Used in Character, Player, Conditional. Needs characters from adapter/context.
- **ConditionAutocomplete** — Conditional node conditions; flagSchema.
- **Choice inputs** — PlayerNodeFields: choice text, nextNodeId, conditions per choice. State (choiceInputs, debouncedChoiceInputs, expandedChoices, dismissedChoices) can live in the section render or in a small hook.
- **Condition inputs** — ConditionalNodeFields: condition blocks; conditionInputs, debouncedConditionInputs, dismissedConditions, expandedConditions, debounceTimersRef. Same idea: local state or hook in the section.
- **Storylet call** — StoryletNodeFields, DetourNodeFields: targetGraphId, targetStartNodeId, returnNodeId, returnGraphId; graph list for picker. List graphs via **React Query hooks** calling Payload (e.g. `useForgeGraphs`), not adapter. See [55-data-access-and-export.md](55-data-access-and-export.md).
- **listPages** — Act/Chapter/Page fields need list of pages (from WriterDataAdapter or equivalent) scoped by narrative graph and page type. Forge-agent: if narrative graph nodes stay and Writer uses Notion pages, decide whether Act/Chapter/Page nodes still have “linked page” pickers or become pure graph nodes.

## Ideas and concerns

- **Registry vs hardcoded map:** Dialogue-forge uses a switch in NodeEditorFields. Forge-agent can use the same (switch on node.data.type) or a registry (nodeType → component map) for extensibility.
- **Injecting flagSchema, characters, listPages:** Forge-agent inspector sections are built in the editor (e.g. DialogueEditor); that editor can pass graph, applyOperations, and also flagSchema, characters, listPages (or a context) so the section render has everything the ported *NodeFields need.
- **Notion vs narrative graph:** If forge-agent Writer mode uses PageDoc/BlockDoc for acts/chapters/pages, then Act/Chapter/Page **nodes** in the narrative graph might only store a pageId reference (or no link). Plan 32 and 40 document the product decision.
