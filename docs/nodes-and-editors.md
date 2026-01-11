# Dialogue Nodes & Editors

This document describes the node types, editor structure, and recommended patterns for extending Dialogue Forge’s node system. It also captures the intended storylet + saliency behaviors so UI and data models stay aligned with Yarn Spinner concepts.

## Node Type Overview

### NPC Nodes
- **Purpose:** A single line of dialogue spoken by an NPC.
- **Core fields:** `speaker`, `characterId`, `content`, `nextNodeId`.
- **Editor:** `NpcNodeFields` in `src/components/NodeEditor.tsx`.

### Player Nodes
- **Purpose:** A choice point that renders multiple responses.
- **Core fields:** `choices[]` with `text`, `nextNodeId`, optional conditions and flag updates.
- **Editor:** `PlayerNodeFields` in `src/components/NodeEditor.tsx`.

### Conditional Nodes
- **Purpose:** Branch based on Yarn condition expressions.
- **Core fields:** `conditionalBlocks[]` with block type, conditions, and next node.
- **Editor:** `ConditionalNodeFields` in `src/components/NodeEditor.tsx`.

### Storylet Nodes
- **Purpose:** A Yarn node that acts as a storylet in the graph (node-level storylet).
- **Core fields:** `storyletCall` (template wiring), `content`, and `nextNodeId`.
- **Editor:** `StoryletNodeFields` in `src/components/NodeEditor.tsx`.
- **Node UI:** `StoryletDialogueNodeV2` in `src/components/StoryletDialogueNodeV2.tsx`.

### Storylet Node Groups (Randomizer Node Type)
- **Purpose:** A node group that selects the most salient storylet entry, aligned with Yarn’s node-group behavior (not weighted random).
- **Core fields:** `randomizerBranches[]` with `label`, `nextNodeId`, and optional `storyletPoolId` as a group ID.
- **Editor:** `StoryletNodeGroupBranches` in `src/components/NodeEditor.tsx`.
- **Recommendation:** Avoid weights or seeds; rely on saliency strategies for ordering.

### Storylet Pool Nodes (Legacy)
- **Purpose:** Historical node type that overlaps with storylet node groups.
- **Recommendation:** Prefer storylet node groups and keep pools as narrative data structures instead of node types.
- **Editor:** `StoryletNodeGroupFields` in `src/components/NodeEditor.tsx`.
- **Node UI:** `StoryletNodeGroupDialogueNodeV2` in `src/components/StoryletNodeGroupDialogueNodeV2.tsx`.

## Storylet Call Wiring

`DialogueNode.storyletCall` stores the wiring metadata used when invoking a storylet or storylet node group:

- `templateId`: The storylet template or node group identifier.
- `entryPolicy`: Strategy for entering the storylet (e.g., saliency selection).
- `entryNodeId`: Optional node override for entry.
- `returnPolicy`: Strategy for returning to the main flow.
- `returnNodeId`: Optional node override for return.

Keep `storyletCall` as the single source of truth in new UI/editor work to avoid ambiguity with legacy `storyletId`/`storyletPoolId`.

## Editor Composition

`src/components/NodeEditor.tsx` is intentionally composed into focused subcomponents:

- `NpcNodeFields`
- `PlayerNodeFields`
- `ConditionalNodeFields`
- `StoryletNodeFields`
- `StoryletNodeGroupFields`
- `StoryletNodeGroupBranches`

These subcomponents keep node-specific logic isolated and make it easier to extend node UI without touching unrelated logic.

## File Structure Recommendations

When adding new node types or editors:

1. **Types & constants**
   - Add new node type constants in `src/types/constants.ts`.
   - Extend `DialogueNode` in `src/types/index.ts` with any new fields.
2. **Node UI component**
   - Create a dedicated component in `src/components/` (one node type per file).
    - Register it in `src/components/DialogueGraphEditor.tsx`.
3. **Node editor section**
   - Add a dedicated editor subcomponent in `src/components/NodeEditor.tsx`.
   - Keep shared field UI in small helpers (e.g., `NextNodeSelector`, `StoryletCallFields`).
4. **Saliency alignment**
   - Prefer saliency-driven ordering over explicit weights.
   - Document any deviation from Yarn Spinner’s default selection strategies.

## Saliency & Yarn Spinner Alignment

Storylets and node groups should align with Yarn Spinner’s saliency strategies:

- **Default strategy:** Random Best Least Recently Viewed.
- **Avoid:** Weighted randomness and explicit seed inputs for node group selection.
- **Allow:** Conditions on storylets and multiple `when` clauses to control saliency.

This keeps the editor’s behavior consistent with Yarn Spinner’s expectations and avoids duplicate selection mechanisms.
