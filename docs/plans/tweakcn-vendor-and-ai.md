# Plan: Consumer registry docs, numbered guides, vendor tweakcn, and AI integration

**Audience:** Codex (or any agent) with no chat history. Execute in **dialogue-forge**; use the **forge-agent** repo as reference for structure, vendor workflow, and CopilotKit/runtime.

**Goals:**
1. Document how to install from the local registry as a consumer (Verdaccio).
2. Make dialogue-forge docs look better and numbered like the other repo.
3. Install tweakcn as a vendor (like opencode / forge-agent vendor setup).
4. Get tweakcn up and running with AI (OpenRouter or our copilot runtime) as soon as possible.

---

## Part A: Other repo (forge-agent) — locations and structure

Use this to navigate the **other codebase** when you need reference. Clone it if you don’t have it (path is environment-specific; e.g. sibling `forge-agent/` or elsewhere).

### Root layout (forge-agent)

- **verdaccio.yaml** — Config for local npm registry (storage, proxy to npmjs, `@forge/*` and `@twick/*` publish).
- **package.json** — Scripts: `registry:start`, `registry:forge:build`, `registry:forge:publish:local`; workspaces.
- **examples/consumer** — Minimal app that consumes `@forge/dev-kit` (from registry or `workspace:*`).
- **packages/** — `@forge/ui`, `@forge/shared`, `@forge/agent-engine`, `@forge/dev-kit` (and any `@twick/*` vendored).

### Docs (forge-agent)

Numbered guides live in a **docs/** or **docs/guides/** style tree:

- **01 - Foundation** — Repo structure, packages, running the app.
- **05 - Building an editor / workspace** — Build your own editor in the repo.
- **20 - Create an editor** — Wire a new editor to the app shell.
- **24 - Vendoring third-party code** — Twick vendor workflow, build + publish to Verdaccio.
- **25 - Verdaccio and local registry** — Start registry, login, publish flow, **consume from another repo** (`.npmrc`, add dependency, install, use).

Architecture docs (e.g. **04 - Component library and registry**) describe publish/consume and dev-kit surface.

### Vendor workflow (forge-agent)

- Third-party code lives under **vendor/** (e.g. Twick).
- There is a **vendoring guide (24)** with: add repo, build, publish to Verdaccio (or sync into app).
- Consumer repos use **.npmrc** with `@forge:registry=http://localhost:4873` and add `@forge/dev-kit` (and overrides if published deps use `workspace:*`).

### CopilotKit / runtime (forge-agent)

- The other repo has **CopilotKit working with the runtime** (e.g. ForgeCopilotProvider, createForgeCopilotRuntime, or similar).
- Use that wiring as reference when adding AI to tweakcn in dialogue-forge (provider, runtime URL, actions).

---

## Part B: Codebase agent strategy (both repos)

### In dialogue-forge (this repo)

1. Read **docs/agent-artifacts/core/STATUS.md** (or docs/STATUS.md).
2. Read **AGENTS.md** at repo root.
3. Read **docs/architecture/workspace-editor-architecture.md**.
4. Before touching a domain, read that domain’s **AGENTS.md**:
   - packages/shared, packages/forge, packages/writer, packages/video, packages/characters, packages/ai.
5. After changes: update STATUS and relevant domain AGENTS with new footguns or rules.

### In forge-agent (other repo)

- Same idea: read root **AGENTS.md** (or equivalent), then **docs/** and any **packages/*/AGENTS.md** before editing. Use its numbered guides and architecture docs as the source of truth for vendor flow and registry consumer steps.

---

## Part C: Tasks (implement in dialogue-forge)

### Task 1: Document how to install from the local registry as a consumer

- Add a **numbered guide** in dialogue-forge that explains the **consumer** side only (no Verdaccio server setup).
- Suggested path: **docs/guides/15-install-from-local-registry.md** (or **docs/how-to/15-install-from-local-registry.md** if you keep how-to and add numbers).
- Style it like the other repo’s “25 - Verdaccio and local registry” but focused on “Consume from another repo”:
  - **Title:** `15 - Install from local registry (consumer)` (or similar).
  - **Frontmatter:** `title`, `created`, `updated` (e.g. 2026-02-07).
  - **Sections:**
    - What is this (install `@forge/*` / `@twick/*` from a running Verdaccio instance).
    - Prerequisites (Verdaccio running at http://localhost:4873; started from the forge-agent repo).
    - **.npmrc** in consumer repo root: `@forge:registry=http://localhost:4873`, `@twick:registry=http://localhost:4873`.
    - **package.json:** add dependency e.g. `"@forge/dev-kit": "^0.1.0"`.
    - **pnpm overrides** (root package.json): if the published dev-kit still uses `workspace:*` for `@forge/ui` (etc.), add overrides so those resolve from the registry: `"@forge/ui": "^0.1.0"`, `"@forge/shared": "^0.1.0"`, `"@forge/agent-engine": "^0.1.0"`.
    - **Install:** `pnpm install --no-frozen-lockfile` (with Verdaccio running).
    - **Use:** e.g. `import { EditorShell, DockLayout } from '@forge/dev-kit'`; optional bridge file in app (e.g. `apps/studio/lib/forge/dev-kit-bridge.ts`).
    - Troubleshooting: E409 login, registry not reachable, workspace:* resolution (overrides).
- Link this guide from **docs/README.md** and, if present, **docs/agent-artifacts/core/agents.md** or migration docs.

### Task 2: Make docs look better and numbered (like the other repo)

- Introduce **numbered guides** so key docs have a clear order and match the other repo’s style.
- Options:
  - **Option A:** Create **docs/guides/** and add numbered files: e.g. `01-foundation.md`, `05-building-a-workspace.md`, `15-install-from-local-registry.md`. Move or copy content from existing how-to/architecture where it fits; add frontmatter (`title`, `created`, `updated`).
  - **Option B:** Rename or add numbers under existing **docs/how-to/** (e.g. `01-foundation.md`, `02-forge-workspace-walkthrough.md`, …) and add the same frontmatter.
- Each numbered guide should have:
  - First line: `# NN - Short title` (e.g. `# 15 - Install from local registry (consumer)`).
  - Optional YAML frontmatter: `title`, `created`, `updated`.
  - Clear sections (What, Prerequisites, Steps, Related).
- Update **docs/README.md** to list the numbered guides and point to the new structure so agents and humans can follow in order.

### Task 3: Install tweakcn as a vendor (like opencode / forge-agent vendor setup)

- **tweakcn:** https://github.com/jnsahaj/tweakcn — visual no-code theme editor for shadcn/ui (Tailwind + shadcn).
- **Vendor it** in dialogue-forge using the same pattern as **vendor/opencode**:
  - Add as submodule: `git submodule add https://github.com/jnsahaj/tweakcn vendor/tweakcn` (or clone into vendor/tweakcn and track; repo uses npm/pnpm).
  - **package.json** scripts (root):
    - `vendor:tweakcn:install`: `cd vendor/tweakcn && pnpm install` (or npm install).
    - `vendor:tweakcn:dev`: run tweakcn dev server (e.g. `cd vendor/tweakcn && pnpm dev`) so it’s runnable standalone.
    - If you need to copy build output into the host app: `vendor:tweakcn:build`, `vendor:tweakcn:sync`, and a **scripts/sync-tweakcn.js** (similar to sync-opencode-ui.js). Only add if the integration plan requires copying built assets.
  - **Integration:** Tweakcn is a full Next.js app. Choose one:
    - **A)** Run it as a separate app (different port) and link to it from studio (e.g. “Open theme editor” opens new tab/window).
    - **B)** Mount tweakcn inside studio (e.g. route `apps/studio/app/(tweakcn)/tweakcn/...` using tweakcn’s components or pages). May require adapting tweakcn’s routing or embedding key components.
  - Document in **docs/guides/** or **docs/how-to/** (e.g. `20-vendor-tweakcn.md`): how to clone/update submodule, install, run, and where it’s integrated (route or link).
- Add a short **docs/guides/20-vendor-tweakcn.md** (or similar number) describing the vendor setup and integration so future agents know how to update and run tweakcn.

### Task 4: Get tweakcn up and running with AI (OpenRouter / copilot runtime)

- **Goal:** Use OpenRouter or our existing copilot runtime so tweakcn has AI (e.g. “suggest theme”, “generate preset”, or chat help).
- **Reference (dialogue-forge):**
  - **packages/ai:** CopilotKit provider and runtime wiring (`packages/ai/src/copilotkit/providers/CopilotKitProvider.tsx`, runtimeUrl `/api/copilotkit`).
  - **apps/studio:** Where the copilot API route and provider are mounted; ensure there is an `/api/copilotkit` (or equivalent) route and that the studio layout wraps the app with CopilotKit (or similar) when needed.
- **Reference (forge-agent):** See how CopilotKit is wired to the runtime there (provider, runtime URL, actions) and mirror that pattern for tweakcn.
- **Steps:**
  1. **Confirm studio has a working AI runtime** — OpenRouter or CopilotKit runtime at e.g. `/api/copilotkit`, and a provider wrapping the app (or the part where tweakcn will live).
  2. **Expose AI to tweakcn** — Either:
     - **Option A:** If tweakcn is a separate tab/app: that app can call the same runtime URL (e.g. same origin `/api/copilotkit`) and use the same provider pattern if it’s a Next.js app under the same host.
     - **Option B:** If tweakcn is embedded in studio (route or iframe): wrap the tweakcn route with the existing CopilotKit provider so the sidebar/chat can interact with the page; or add a “Suggest with AI” surface inside the tweakcn UI that calls the runtime (e.g. fetch to `/api/copilotkit` or use CopilotKit hooks).
  3. **Minimal first step:** Get one AI touchpoint working (e.g. a button in the tweakcn UI that sends a prompt to OpenRouter or the copilot runtime and displays the result). Prefer reusing the existing runtime and provider so tweakcn is “with AI” as soon as possible.
- Document in the same or a follow-up guide (e.g. “tweakcn + AI”) what was done: which provider/runtime, which route, and how tweakcn invokes it.

---

## Part D: Summary checklist for Codex

- [ ] **Other repo:** Clone or locate forge-agent; use its docs (01, 05, 20, 24, 25) and vendor/CopilotKit setup as reference.
- [ ] **Agent strategy:** In dialogue-forge, read STATUS, AGENTS.md, workspace-editor-architecture, domain AGENTS before editing.
- [ ] **Consumer registry doc:** Add numbered guide (e.g. 15) for “Install from local registry (consumer)” with .npmrc, package.json, overrides, install, use, troubleshooting.
- [ ] **Numbered docs:** Add docs/guides/ (or renumber how-to) with 01-, 05-, 15-, 20- style and frontmatter; update docs/README.md.
- [ ] **Vendor tweakcn:** Add vendor/tweakcn (submodule or clone), package.json scripts (install, dev, optionally build/sync), integration (route or link), and a short vendor guide (e.g. 20).
- [ ] **tweakcn + AI:** Wire tweakcn to OpenRouter or copilot runtime using existing packages/ai and studio API; one working AI touchpoint; document.

---

## Resolved: Vendor tweakcn build errors (Studio)

When building Studio, code under `vendor/tweakcn` can trigger:

1. **Module not found: `@neondatabase/serverless`** — Fixed by adding `@neondatabase/serverless` to `apps/studio/package.json` (drizzle/neon driver is pulled in by vendor/tweakcn db/auth/middleware).
2. **Export `PanelResizeHandle` doesn't exist** — Fixed by aligning vendor tweakcn with workspace `react-resizable-panels` v4: `vendor/tweakcn/components/ui/resizable.tsx` uses `Group`, `Panel`, `Separator` and maps `direction` → `orientation`; `ResizablePanel` forwards `ref` to `panelRef`; `vendor/tweakcn/components/block-viewer.tsx` uses type `PanelImperativeHandle`.

Documented in `docs/agent-artifacts/core/STATUS.md` (Vendor tweakcn) and `docs/guides/20-vendor-tweakcn.md` (Troubleshooting).

---

## File locations (dialogue-forge, quick reference)

- Root: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `AGENTS.md`
- Docs: `docs/README.md`, `docs/architecture/`, `docs/how-to/`, `docs/plans/`, `docs/agent-artifacts/core/`
- Vendor: `vendor/opencode/`, `scripts/sync-opencode-ui.js`, `scripts/update-opencode-submodule.js`
- Studio app: `apps/studio/`, `apps/studio/app/`, `apps/studio/lib/`
- AI: `packages/ai/src/copilotkit/`, `packages/ai/src/aiadapter/openrouter/`
other codebase repo root is this.  we should update our docs saying that we are viewing and aligning ourselves with them very much and reading that codebase as it is the publisher of the dev-kit and has significant codebase structure that this one will need to emulate.  we need to update our codebase agent strategy for this repo to align as a consumer and playground to introduce new very experimental features to the publisher repo...forge