# Ideas and concerns

Open questions and design notes for migration. Update as decisions are made.

## Node and nodefield implementation

- **Registry vs hardcoded map:** Use a single “forge.node” section that switches on node.type (hardcoded map of type → component) for simplicity. If forge-agent later adds plugin or custom node types, consider a registry.
- **Inspector section registration:** Forge-agent builds sections in the editor (e.g. forgeInspectorSections in DialogueEditor). Keep section definitions in one place so adding a new node type = add case in dispatch + add *NodeFields component; no scattered registration.
- **Single source of truth for node data:** Edits go through applyOperations (updateNode). Do not duplicate node state in inspector; always read from graph.flow.nodes and write via applyOperations so the graph store stays canonical.
- **Avoid code smells:** No duplicate “node draft” in inspector; no hidden state that diverges from graph. Debounced inputs (choice text, condition text) are UI-only; flush to updateNode on blur or submit.

## Notion vs narrative graph (decided)

- **No association:** Writer pages (Notion-style PageDoc/BlockDoc) are not linked to the narrative graph. Narrative graph has only Page, Detour, Jump nodes (structure-only). Writer needs branching (different directions, multi-user, agent mass edits) and is installed like other editors in forge-agent.
- **listPages:** Not scoped by narrative graph; list PageDocs by parent (Notion hierarchy). Narrative nodes do not have pageId.

## Yarn

- **Single-graph vs composed export in UI:** Default: Yarn modal shows export of the **current** graph (narrative or storylet). To get full composed output (with storylet/detour inlined), export must be called with createWorkspaceContext(store). Expose “Export current” (single) and “Export composed” (with context) if product needs both; otherwise always use context so inlining works.
- **Duplicate node ids when inlining:** When we inline a referenced graph into the same .yarn output, ensure node ids are unique (e.g. prefix with graph id) so Yarn Spinner does not report “More than one node is named …”. See [12-yarn-spinner-alignment.md](12-yarn-spinner-alignment.md).

## General

- **Testing:** Port or add tests for yarn-converter (round-trip, handlers) and for inspector (updateNode applied correctly). Reduces regressions when multiple agents touch the same area.
- **Docs in forge-agent:** After porting, update forge-agent’s 09-dialogue-domain-and-yarn-spinner and how-to/06-forge-workspace-walkthrough (or equivalent) so they describe the migrated behavior and point to types/handlers in forge-agent.

## Phase 1 scope

- **Import .yarn:** Full Storylet and Detour handler coverage (export + import) is Phase 1. Tests for storylet and detour (round-trip, edge cases) with mocking where needed.
- **Flag manager:** Not Phase 1 in forge-agent. The flag/schema manager must be **overhauled in dialogue-forge** (data model, UI, persistence, validation) before being introduced into forge-agent. Follow-up in forge-agent after overhaul.

## Open questions (for discussion)

1. Writer editor: standalone “Writer editor” tab or a mode inside a unified app? Affects layout and routing in forge-agent.
