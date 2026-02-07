# Parity overview

High-level mapping from dialogue-forge to forge-agent. Use this to orient before diving into a specific plan.

## Workspace → Editor

| dialogue-forge | forge-agent | Notes |
|----------------|-------------|--------|
| ForgeWorkspace | DialogueEditor | `editorId="dialogue"`, `data-domain="dialogue"`. |
| WriterWorkspace | Writer editor or Notion-style Writer mode | Forge-agent has PageDoc/BlockDoc (Notion-inspired); mapping in plan 32. |
| WorkspaceShell | EditorShell | See forge-agent how-to/21-migration-guide-workspace-to-editor. |
| WorkspaceLayoutGrid | DockLayout | Resizable panels. |
| WorkspaceInspector | WorkspaceInspector (or EditorInspector) | Selection-driven; InspectorSection[] with when/render. |
| Node editor panel | Inspector right panel | NodeEditor/NodeEditorFields → InspectorSection(s) per node type. |

## Graph types

| dialogue-forge | forge-agent | Notes |
|----------------|-------------|--------|
| FORGE_GRAPH_KIND.NARRATIVE | narrative | Same concept; dual narrative/storylet in DialogueEditor. |
| FORGE_GRAPH_KIND.STORYLET | storylet | Same concept. |
| graphs.byId, activeNarrativeGraphId, activeStoryletGraphId | App-shell / graph store | Forge-agent already has dual panels; ensure types and store align. |

## Node types

| dialogue-forge | forge-agent today | Migration |
|----------------|-------------------|-----------|
| ACT, CHAPTER, PAGE | — | Add to @forge/types/graph (plan 30). |
| CHARACTER, PLAYER, CONDITIONAL | CHARACTER, PLAYER, CONDITIONAL | Extend ForgeNode (choices, conditionalBlocks, etc.). |
| STORYLET, DETOUR | — | Add; ForgeStoryletCall, targetGraphId, returnNodeId. |
| Narrative editor nodes | — | Act, Chapter, Page, Conditional, Detour, Storylet. |
| Storylet editor nodes | — | Character, Player, Conditional, Storylet, Detour. |

## Inspector

| dialogue-forge | forge-agent | Notes |
|----------------|-------------|--------|
| NodeEditor + NodeEditorFields (switch by node.type) | forgeInspectorSections: one “forge.node” section | Currently generic (label, content, speaker). Migrate to per-type fields (CharacterNodeFields, PlayerNodeFields, etc.) or one section that dispatches by type. |
| FlagSchema, characters, listPages | Adapter/context | Inject into inspector sections where needed. |
| NodeEditorHeader, NodeEditorIdField, NextNodeSelector, etc. | Inspector section content | Map to InspectorSection render(). |

## Yarn

| dialogue-forge | forge-agent | Notes |
|----------------|-------------|--------|
| exportToYarn(graph, context?) | — | Port yarn-converter; handlers, registry, runtime-export, workspace-context (plan 30). |
| importFromYarn | — | Port; parse .yarn → ForgeGraphDoc. |
| Storylet/Detour inlining | — | createWorkspaceContext(store) so handlers can resolve target graphs. |
| YarnView / ForgeYarnModal | Yarn preview/export UI | Phase 1 in forge-agent 09-dialogue-domain-and-yarn-spinner. |

## Writer / Pages

| dialogue-forge | forge-agent | Notes |
|----------------|-------------|--------|
| Acts, chapters, pages (tree) | PageDoc, BlockDoc, PageParent | Notion-inspired; plan 32 defines mapping (narrative graph nodes vs Notion pages). |
| WriterDataAdapter, WriterForgeDataAdapter | Adapters for Writer mode | Equivalent contracts in forge-agent. |
| Lexical editor, AI patch (WriterPatchOp) | — | Plan 32. |

## Out of scope

- **Edge-drop:** All edge-drop behavior and UI (connect-from-handle menu, EdgeDropMenu, useEdgeDropBehavior, etc.). Do not migrate. See [11-out-of-scope.md](11-out-of-scope.md).
