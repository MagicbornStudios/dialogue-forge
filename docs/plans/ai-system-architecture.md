# AI System Architecture and Cleanup Plan

**Status**: Planned — to be executed by a dedicated agent.  
**Linked from**: [ROADMAP.md](../../ROADMAP.md) (AI System section).

---

## 1. Goal

Build a **barebones, domain-aware AI system** that:

- Defines **per-domain agents**: Forge (help create graphs), Writer (help write stories), Video (help create templates).
- Provides a **unified chat system** that can talk to the right agent for the current workspace.
- Stays **decoupled from domains** at the core: the AI layer does not depend on Forge/Writer/Video internals; domains integrate via a clear contract (context + actions).
- **Keeps existing CopilotKit usage** in each domain (frontend actions, useCopilotReadable, useCopilotAction) and weaves in the new agent + chat layer so that chat and sidebar work together.

Outcome: one place to define “what the AI can do” per domain, one chat surface, and a path to server-side agents (e.g. AG-UI / LangGraph) later without rewriting domains.

---

## 2. Current State (Pre–Cleanup)

- **Runtime**: Single route `/api/copilotkit` — CopilotRuntime + OpenAIAdapter (OpenRouter). No custom agents, no LangGraph.
- **Client**: `src/ai/copilotkit/providers/CopilotKitProvider.tsx` — wraps app with CopilotKit + CopilotSidebar. No domain-specific logic.
- **Per-domain**: Writer, Forge, Video each have their own CopilotKit integration:
  - **Writer**: `src/writer/copilotkit/` — context (useWriterCopilotContext), workspace actions, editor actions.
  - **Forge**: `src/forge/copilotkit/` — context, workspace actions, graph editor actions.
  - **Video**: `src/video/workspace/copilot/` — context and actions.
- **Docs**: [docs/ai.md](../ai.md), [docs/copilotkit-setup.md](../copilotkit-setup.md) describe AI layer and CopilotKit setup.

Custom draft (`_status`) has been removed from all collections; Payload versions are the single source of draft/publish behavior.

---

## 3. Target Architecture (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (per workspace)                                        │
│  - CopilotKitProvider + Sidebar (existing)                       │
│  - useCopilotReadable / useCopilotAction (existing, keep)        │
│  - New: Chat UI that targets “current domain agent”              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  AI Layer (src/ai/) — barebones, no domain imports              │
│  - Agent registry: Forge | Writer | Video (by route/context)     │
│  - Chat orchestrator: route messages to correct agent            │
│  - Contract: domain provides “context” + “actions” (existing)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Runtime (app/api/copilotkit or future AG-UI endpoint)           │
│  - Today: OpenRouter via CopilotKit                              │
│  - Future: Optional LangGraph/AG-UI server-side agents           │
└─────────────────────────────────────────────────────────────────┘
```

- **Domains** keep their current CopilotKit hooks and actions; no requirement to move those into `src/ai/`.
- **AI layer** defines the *concept* of per-domain agents (Forge / Writer / Video) and a chat system that uses them, without implementing domain logic itself.
- **Chat system** is the main new surface: user chats; the system decides which agent (Forge/Writer/Video) handles the conversation based on current route or context, and forwards to that agent’s instructions + context + actions.

---

## 4. Per-Domain Agent Definitions (What We’re Building Toward)

| Domain  | Agent purpose              | Example capabilities (to be implemented)        |
|---------|----------------------------|------------------------------------------------|
| **Forge** | Help create and edit graphs | Suggest nodes, add nodes from chat, explain flow, validate structure |
| **Writer** | Help write stories          | Suggest text, rewrite selection, outline chapters, continuity check |
| **Video** | Help create templates       | Suggest layers, add scene/layer from chat, suggest layout, export tips |

Agents are **defined** in the AI layer (name, instructions, which context/actions to use). Implementation of “how” can stay in domains (existing CopilotKit actions) or move to server-side tools later.

---

## 5. Cleanup and Implementation Tasks (For Executing Agent)

### 5.1 AI domain cleanup (barebones, no domain coupling)

- **Audit `src/ai/`**: Remove or simplify any code that directly imports from `src/forge/`, `src/writer/`, or `src/video/` (except via a narrow contract, e.g. “context string” + “action names”). Goal: AI layer does not depend on domain internals.
- **Single entry point**: One clear place that defines “what the AI can do” per workspace (e.g. a registry or config: Forge → instructions + context provider + action names; Writer → …; Video → …). Existing CopilotKit providers in each domain can remain; the AI layer only needs to know how to *invoke* or *configure* them for chat.
- **Document contract**: In [docs/ai.md](../ai.md), document: (1) Domains expose context (useCopilotReadable) and actions (useCopilotAction). (2) AI layer provides CopilotKitProvider and, in the future, chat routing to the correct agent. (3) No custom draft logic; Payload versions only.

### 5.2 Chat system

- **Chat UI**: Add a chat surface (e.g. sidebar panel or dedicated chat view) that sends messages to the “current domain agent.” Current workspace is determined by route (e.g. `/writer` → Writer agent, `/forge` → Forge agent, `/video` → Video agent) or by a context value set by the active workspace.
- **Orchestration**: When the user sends a message in chat, the system uses the active agent’s instructions + context (from existing useCopilotReadable in that domain) + actions (existing useCopilotAction). No need to duplicate context or actions; reuse existing domain CopilotKit registration.
- **Integration**: Ensure CopilotKitProvider (or equivalent) is used so that the same runtime handles both the existing sidebar and the new chat (e.g. same CopilotKit instance, different UI entry points).

### 5.3 Weaving in agents

- **Agent registry**: Introduce a minimal “agent registry” (e.g. in `src/ai/`): map workspace id (Forge | Writer | Video) to display name, instructions prefix, and optionally which CopilotKit context/actions to use. Domains do not need to register themselves in the registry at first; the registry can be a static config that points at “the Forge context/actions,” “the Writer context/actions,” etc.
- **Routing**: When the user is on `/forge`, chat uses the Forge agent; on `/writer`, Writer agent; on `/video`, Video agent. Implementation can be as simple as reading the current pathname and selecting from the registry.
- **Keep existing actions**: All current frontend actions (Writer workspace/editor actions, Forge workspace/graph actions, Video actions) stay in their domains and keep working with the sidebar. The chat system simply uses the same CopilotKit backend and the same context/actions for the active workspace.

### 5.4 Optional: Server-side and AG-UI (later)

- **Document direction**: In [docs/ai.md](../ai.md), add a short “Future: server-side agents and AG-UI” section: goal is to move complex or multi-step behavior to server-side agents (e.g. LangGraph) speaking AG-UI, with CopilotKit as the frontend. No implementation required in this plan.
- **Minimal PoC (optional)**: If useful, add one minimal AG-UI-compatible or LangGraph-backed endpoint and document how CopilotKit would call it once we switch. Not blocking for the barebones system or chat.

---

## 6. Out of Scope for This Plan

- **Adapters and collections**: Already updated; custom `_status` removed from all collections and adapters. No further adapter/collection work in this plan.
- **Domain feature work**: No new Forge/Writer/Video features; only integration points for AI (context + actions) and chat.
- **Full LangGraph/AG-UI migration**: This plan gets the architecture and chat in place; migrating all behavior to server-side agents is a follow-up.

---

## 7. Acceptance Criteria (For Executing Agent)

- [ ] `src/ai/` has no direct imports from `src/forge/`, `src/writer/`, or `src/video/` (except via a documented, narrow contract if any).
- [ ] A single “agent registry” or config exists that defines Forge, Writer, and Video agents (name, instructions, and how to resolve context/actions for the active workspace).
- [ ] A chat UI exists and routes messages to the agent for the current workspace (route or context).
- [ ] Existing CopilotKit sidebar and frontend actions in Writer, Forge, and Video still work.
- [ ] [docs/ai.md](../ai.md) is updated with: current architecture, per-domain agent model, chat system, and optional “Future: AG-UI/server-side” subsection.
- [ ] ROADMAP.md links to this plan and lists “AI system architecture and chat” as a planned item.

---

## 8. File and Doc References

| Area | Location |
|------|----------|
| CopilotKit provider | `src/ai/copilotkit/providers/CopilotKitProvider.tsx` |
| CopilotKit runtime | `app/api/copilotkit/route.ts` |
| Writer CopilotKit | `src/writer/copilotkit/` |
| Forge CopilotKit | `src/forge/copilotkit/` |
| Video CopilotKit | `src/video/workspace/copilot/` |
| AI overview | `docs/ai.md` |
| CopilotKit setup | `docs/copilotkit-setup.md` |
| Roadmap | `ROADMAP.md` |

This plan is intended to be executed by an agent; update this document as implementation progresses.
