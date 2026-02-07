# Migration to forge-agent — Index

**For agents.** This folder is the canonical place for migration plans and parity docs. Read this first when working on migration.

## Purpose

Migrate Writer and ForgeWorkspace nodes and Yarn implementation from this repo (dialogue-forge) into forge-agent. Keep our Yarn logic and node/nodefield implementation; **do not migrate edge-drop** (it never worked). Workspaces here map to editors there; the new codebase uses a Notion-inspired page structure.

## Before you start

1. Read [01-agent-strategy-migration.md](01-agent-strategy-migration.md) for the Ralph Wiggum loop.
2. Read [11-out-of-scope.md](11-out-of-scope.md) so you do not reintroduce edge-drop.
3. Read the specific plan you are executing (30–33) and [docs/agent-artifacts/core/STATUS.md](../../agent-artifacts/core/STATUS.md) (or MIGRATION.md).

## After each slice

Update the plan’s Done list and “Next” section; update [docs/agent-artifacts/core/MIGRATION.md](../../agent-artifacts/core/MIGRATION.md) (or STATUS) with a one-line “Done: …”.

## Document list

| Doc | Purpose |
|-----|--------|
| [01-agent-strategy-migration.md](01-agent-strategy-migration.md) | Ralph Wiggum loop for migration; how to use these plans. |
| [10-parity-overview.md](10-parity-overview.md) | ForgeWorkspace → DialogueEditor; WriterWorkspace → WriterEditor; node types; inspector. |
| [11-out-of-scope.md](11-out-of-scope.md) | **Edge-drop:** do not migrate; full list of edge-drop surface. |
| [12-yarn-spinner-alignment.md](12-yarn-spinner-alignment.md) | How our nodes and export fit Yarn Spinner; official docs refs. |
| [20-dialogue-forge-inventory.md](20-dialogue-forge-inventory.md) | Inventory: ForgeWorkspace, node types, NodeEditor, yarn-converter (no edge-drop). |
| [21-writer-forge-inventory.md](21-writer-forge-inventory.md) | Writer workspace: store, layout, editor, adapters, sync. |
| [22-node-and-inspector-mapping.md](22-node-and-inspector-mapping.md) | NodeEditor/NodeEditorFields → forge-agent InspectorSection; data shape. |
| [30-plan-yarn-and-graph-types.md](30-plan-yarn-and-graph-types.md) | Plan: Yarn pipeline and graph types. |
| [31-plan-nodes-and-inspector.md](31-plan-nodes-and-inspector.md) | Plan: Node types and inspector. |
| [32-plan-writer-and-pages.md](32-plan-writer-and-pages.md) | Plan: Writer and pages (Notion alignment). |
| [33-plan-dialogue-editor-chrome.md](33-plan-dialogue-editor-chrome.md) | Plan: Dialogue editor chrome. |
| [40-ideas-and-concerns.md](40-ideas-and-concerns.md) | Ideas, concerns, open questions. |
| [50-game-state-and-player.md](50-game-state-and-player.md) | Plan: Game state, basic player, flag/schema overhaul, Yarn WASM option. |

## Links

- [Agent artifacts index](../../agent-artifacts/README.md)
- [Root AGENTS.md](../../../AGENTS.md) — includes “Migration to forge-agent” subsection.
