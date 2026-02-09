# Plan: Nodes and inspector

Migrate React Flow node components and inspector (node fields) to forge-agent. No edge-drop.

## Steps

### 1. React Flow node components (forge-agent)

- Port from dialogue-forge (packages/forge/.../Nodes/components/): PageNode (narrative), CharacterNode, PlayerNode, ConditionalNode, StoryletNode, DetourNode, JumpNode (and shared pieces: EdgeIcon, EdgeSVGElements, FlagIndicator, etc.). Narrative graph uses only Page, Detour, Jump (no Act/Chapter as separate node types).
- **Omit:** Any *EdgeDropMenu component; any handle or callback that opens an edge-drop menu. Use standard React Flow connect (source/target handles) only.
- Register node types: **Narrative graph:** Page, Detour, Jump (and END if used). **Dialogue editor (ForgeWorkspace):** Character, Player, Conditional, Storylet, Detour.
- Ensure each node component receives and uses the same data shape (ForgeNode) once plan 30 types are in place.

### 2. Inspector: replace generic NodeFields with per-type fields

- Option A (recommended initially): One InspectorSection “forge.node” that dispatches by node.data.type to the ported *NodeFields components (CharacterNodeFields, PlayerNodeFields, ConditionalNodeFields, etc.). See [22-node-and-inspector-mapping.md](22-node-and-inspector-mapping.md).
- Pass graph, applyOperations (or updateNode), and any needed context: flagSchema, characters. Forge-agent DialogueEditor builds forgeInspectorSections with these in closure or from a context. Narrative graph nodes (Page, Detour, Jump) do not link to Writer PageDocs.
- Port: PageNodeFields (narrative), CharacterNodeFields, PlayerNodeFields, ConditionalNodeFields, StoryletNodeFields, DetourNodeFields (and JumpNodeFields if needed). No ActNodeFields/ChapterNodeFields.

### 3. Shared pieces for inspector

- FlagSelector, CharacterSelector, ConditionAutocomplete — port and use inside the appropriate *NodeFields. Ensure flagSchema and characters are available (adapter or context).
- Choice inputs and condition inputs: port state/hook pattern (choiceInputs, debouncedChoiceInputs, expandedChoices; conditionInputs, debouncedConditionInputs, dismissedConditions, expandedConditions) or simplify if forge-agent uses a different pattern.
- Storylet call: targetGraphId, targetStartNodeId, returnNodeId, returnGraphId; list graphs for target picker via **React Query hooks** (e.g. `useForgeGraphs(projectId, kind)`), not adapter. See [55-data-access-and-export.md](55-data-access-and-export.md).

### 4. Notion vs narrative graph (decided)

- **No association** between Writer pages (Notion-style PageDoc/BlockDoc) and narrative graph. Narrative graph has only Page, Detour, Jump nodes (structure-only). Writer mode uses Notion pages for prose with branching (different directions, multi-user, agent mass edits); listPages is not scoped by narrative graph. See plan 32 and [40-ideas-and-concerns.md](40-ideas-and-concerns.md).

## Done

- (None yet.)

## Next

1. Port one node type (e.g. CharacterNode) and CharacterNodeFields to inspector (slice 1).
2. Port remaining node types and their fields (slices 2–8).
3. Port shared FlagSelector, CharacterSelector, ConditionAutocomplete (slice 9).
4. Wire flagSchema and characters into DialogueEditor inspector sections (slice 10).
