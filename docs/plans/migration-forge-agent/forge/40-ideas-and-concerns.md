# Ideas and concerns

Open questions and undecided ideas for migration. Resolved items live in [docs/agent-artifacts/core/decisions.md](../../../agent-artifacts/core/decisions.md) or the relevant plan (30–33, 50–55, 64).

## Resolved (summary)

- **Notion vs narrative graph:** No association; listPages not scoped by narrative graph. See plan 32, ADR-004.
- **Node/inspector:** Single "forge.node" section, dispatch by type; applyOperations for edits. See 31, 22.
- **Yarn:** Composed export with context; node ids as stored (no prefix when inlining). See 12, 52, 54.
- **Flag manager:** Overhaul in dialogue-forge first; not Phase 1 in forge-agent. See 51.

## Open questions (for discussion)

1. Writer editor: standalone "Writer editor" tab or a mode inside a unified app? Affects layout and routing in forge-agent.
2. Yarn modal: expose "Export current" vs "Export composed" in UI, or always use context?
