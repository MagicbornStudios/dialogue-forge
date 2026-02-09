# STATUS (Living)

**Last Updated**: February 9, 2026

## Monorepo Migration Phases (Inline Status)

- Phase 0: Conventions + target architecture docs - DONE
- Phase 1: Workspace scaffolding (apps/ + packages/ + tooling) - DONE
- Phase 2: Domain package extraction - IN PROGRESS
- Phase 3: Tooling + guardrails (dependency rules, CI) - IN PROGRESS
- Phase 4: Publishing flow (multi-package) - NOT STARTED

## Current Repo State

- Build: `pnpm run build` - NOT VERIFIED (timed out locally)
- Typecheck: `pnpm run typecheck:domains` - PASS
- Typecheck: `pnpm run typecheck:studio` - PASS
- Package manager: pnpm (installed via official script); `packageManager` field set in root `package.json`
- If `pnpm` isn't found in a new shell, restart the terminal (installer updates PATH).
- Build notes:
  - Next.js pinned to 15.5.7 to match published `@next/swc` binaries.
  - pnpm reported ignored build scripts (run `pnpm approve-builds` only if native deps break).
- Root package is `private` and uses Turborepo scripts
- Studio app lives in `apps/studio`
- Domain source lives in `packages/{shared,forge,writer,video,characters,theme,ai}`
- Umbrella package lives in `packages/dialogue-forge`
- `@/` path alias removed from package code; use `@magicborn/<domain>/*` + relative Studio imports

## Decisions Locked
- Video workspace is Twick-only. Legacy video workspace is removed.
- No draft slices and no event bus in new or refactored workspace architecture.
- `packages/**` must never import `apps/studio/**` or generated host app types.
- Data access uses package-owned React Query hooks; host provides a shared payload client via `ForgePayloadProvider`.
- Use constants for discriminated types (no string literals).
- No @/ alias in code; use @magicborn/<domain>/* or relative paths.
- Tweakcn submodule is reference-only; first-class runtime integration is `packages/theme` + Studio routes.
- Theme AI and Copilot runtime use strict OpenRouter free-model routing (`OPENROUTER_THEME_MODELS_FREE` preferred; falls back to free `OPENROUTER_MODEL_FAST`/`AI_DEFAULT_MODEL` when available).

## Agent Loop (Non-Negotiable)

1. Read this STATUS doc first.
2. Read root `AGENTS.md`.
3. Read `docs/architecture/workspace-editor-architecture.md`.
4. Do one small, reviewable slice of work.
5. Update STATUS + domain AGENTS with new footguns or decisions.

## Current Priorities

- Keep docs aligned to the extracted packages (architecture + conventions + status).
- Capture any new build blockers in STATUS with exact errors and owners.

## In Progress

- Dialogue-Forge Alignment Program (forge-agent parity, markdown-only):
  - Governance parity docs (`SKILLS`, `ISSUES`, `CONTRIBUTING`, PR template)
  - Agent artifact strategy parity (`00/18/19` docs and core artifact hardening)
  - Writer migration continuation (`blocks`-first editor persistence + legacy field deprecation path)
- Game player MVP alignment slice:
  - Pixi'VN package wiring, shared composition contract, graph runner/storage, server composition route, and Forge play modal.

## Known Build Blockers

- `pnpm run test` is long-running in this workspace and timed out in this environment; use targeted `vitest run <path>` for quick validation while iterating.
- `pnpm run payload:generate` currently fails in this environment on Node 24 (`ERR_REQUIRE_ASYNC_MODULE` from Payload CLI config loading). Typecheck remains green; payload type regeneration needs a Node/Payload runtime compatibility pass.

## Known Runtime Footguns

- With Next alias-based package source imports (`@magicborn/* -> ../../packages/*/src`), ensure `@tanstack/react-query` resolves to a single module instance (webpack + Turbopack aliases in `apps/studio/next.config.mjs`). Duplicate instances cause `No QueryClient set` at runtime even when `QueryClientProvider` is mounted.
- Keep Yjs libraries deduped in Next config aliases (`yjs`, `y-websocket`, `y-protocols`) to avoid duplicate constructor instances and collaborative editing warnings.
- Pixi canvas initialization must remain client-only (`'use client'` and dynamic imports). Do not initialize `pixi.js` or `@drincs/pixi-vn` from server routes/components.

## Studio app layout (full-height main)

For the Studio home page (`apps/studio/app/page.tsx`), the main content area must fill the viewport so workspaces (Forge, Writer, Characters) are not cut off. **Height chain:** `html, body { height: 100% }` in `apps/studio/styles/globals.css`; page root div uses `h-full min-h-0 flex flex-col`; `<main>` uses `flex-1 min-h-0`. Do not remove the html/body height or the root `h-full` or main will not get full remaining height.

## Theme Workspace + AI Footguns

- **Required env for AI routes:** `OPENROUTER_API_KEY` must be set. Provide free-model routing via `OPENROUTER_THEME_MODELS_FREE` (preferred) or free `OPENROUTER_MODEL_FAST` / `AI_DEFAULT_MODEL`.
- **Persistence contract:** Theme data is project-scoped under `projects.settings.themeWorkspace` and must be normalized through `normalizeThemeWorkspaceSettings(...)` before read/write.
- **Fallback policy:** `/api/theme/generate` and `/api/copilotkit` share one primary+fallback chain and send it to OpenRouter via the request `models` array. Avoid ad-hoc model IDs in code.
- **Vendor boundary:** `vendor/tweakcn` is not part of Studio runtime flow. Keep it as a reference/update source only.

## Recent Changes

- Added first game-player MVP slice aligned with docs 50/51/52/64 + ADR-006:
  - shared `ForgeCompositionV1` contract (`packages/shared/src/types/composition.ts`)
  - graph runtime core (`variable-storage`, `runner-events`, `graph-runner`) and composition adapter/resolver
  - Forge `GamePlayer` surface + play modal wiring
  - Studio route `POST /api/forge/player/composition` for on-demand composition generation
  - targeted game-player tests (runner/storage/flattener/composition adapter)
- Added first-class Theme workspace domain at `packages/theme` with:
  - `ThemeWorkspace` UI and package-local store slices (`themeState`, `historyState`, `aiState`, `viewState`)
  - theme schema/defaults/codegen utilities
  - versioned settings contract + normalizer (`ThemeWorkspaceSettingsV1`)
- Integrated Theme workspace into Studio:
  - new `theme` tab in `apps/studio/app/page.tsx`
  - direct route `apps/studio/app/theme/page.tsx`
  - React Query adapter provider at `apps/studio/lib/theme/ThemeDataProvider.tsx`
  - project persistence in `projects.settings.themeWorkspace`
- Added AI endpoints:
  - `POST /api/theme/generate` (OpenRouter free-chain fallback)
  - `POST /api/copilotkit` (Copilot runtime parity on same free-chain policy)
- Aligned Studio AI routes to shared model-router flow:
  - `apps/studio/lib/openrouter-config.ts`
  - `apps/studio/lib/model-router/server-state.ts`
  - `apps/studio/lib/model-router/openrouter-fetch.ts`
- Removed runtime dependency on old tweakcn helper surfaces (`/tweakcn-ai` and `/api/tweakcn/ai`).
- Studio main content full height: set `html, body { height: 100% }` in apps/studio/styles/globals.css and page root to `h-full min-h-0` so the main (flex-1) gets the full remaining viewport instead of being cut off.
- Forge workspace: wrapped `ForgeWorkspaceLayout` in a container with `flex-1 min-h-0 overflow-hidden` so the layout gets bounded height and the bottom (storylet) panel is visible instead of being cut off.
- Removed Forge/Writer data adapter pattern in favor of package-owned hooks:
  - Added `ForgePayloadProvider` and Forge React Query hooks in `packages/forge/src/data/`.
  - Added Writer page/comment hooks in `packages/writer/src/data/` using the same payload client context.
  - Removed adapter contexts/types/providers (`ForgeDataContext`, `WriterDataContext`, host `ForgeDataProvider` / `WriterDataProvider`).
  - Studio now wraps Forge/Writer with a single payload provider in `apps/studio/app/page.tsx`.
- Updated Forge/Writer architecture and walkthrough docs to describe the hook-based data flow and provider requirements.
- Added explicit Next config aliasing for `@tanstack/react-query` so Forge/Writer hooks and host `QueryClientProvider` share one React Query context under webpack and Turbopack.
- Updated dev seed flow to idempotently create missing Forge demo graphs under `Demo Project` (without rewriting existing graph docs on every startup) and set `projects.narrativeGraph` when missing/wrong.
- Hardened Studio project loading (`apps/studio/lib/forge/queries.ts`) with REST fallback when Payload SDK calls fail, and surfaced the real project-load error message in the switcher dropdown for faster diagnosis.
- Project list queries now force `depth=0` and retry with backoff to avoid oversized relationship payloads and transient startup failures while Payload initializes on first API hit.
- Forge and Writer project switchers now expose an explicit retry action in the dropdown when project loading fails (`ProjectSwitcher` `onRetry`).
- Added Next webpack + Turbopack aliases for Yjs packages to keep a singleton module instance alongside the existing React Query aliasing.
- Added Writer migration docs for Notion SDK page/block alignment and reorder planning: new `63-writer-pages-blocks-and-reorder.md`, with linked updates in `00`, `60`, `61`, `62`, and `32` so "what's next" is explicit.
- Added non-breaking Writer block compatibility foundation:
  - new Payload `blocks` collection wiring in Studio config/collection indexes.
  - Writer block contract + mapper utilities (`legacy <-> canonical` and fallback serialized-content resolver).
  - Writer block data hooks (`useWriterBlocks`, CRUD/reorder mutations, `useWriterResolvedPageContent` fallback read path).
- Fixed domain typecheck blockers:
  - Reworked SpeechRecognition typing in Writer plugin.
  - Simplified `@magicborn/dialogue-forge` exports to consume `@magicborn/forge` public API.
- Added numbered consumer/playground docs under `docs/guides/` aligned with forge-agent flow (01, 05, 15, 20, 21).
- Added consumer registry guide for `@forge/*` and `@twick/*` install from local Verdaccio.
- Added `vendor/tweakcn` submodule wiring plus root scripts for install/dev/build/update.
- Updated migration agent strategy doc with explicit consumer/playground alignment to forge-agent.
- Domain packages extracted to `packages/{shared,forge,writer,video,characters,theme,ai}`.
- Runtime package removed; runtime types remain in shared.
- Studio app depends on domain packages (`@magicborn/<domain>`).
- `@/` imports removed from code; Studio uses `@magicborn/<domain>/*` + relative paths.
- Writer project switcher now accepts a render prop; theme switching is optional (no host ThemeSwitcher component).
- Legacy video workspace removed; Twick is the only editor surface.
- Archived legacy `ARCHITECTURE.md`; canonical docs live under `docs/architecture/`.
- Switched workspace installs to pnpm and added `packageManager` field.
- Fixed host global CSS import paths and Tailwind `@source` paths for monorepo layout.
- Root scripts now call `pnpm --filter` for host/lib commands.
- Removed host AI pages (`/ai`, `/ai/architecture`); APIs remain for package usage.
- Added host ESLint config for Next + TS parser; avoid linting generated JS artifacts.
- Updated ProjectSwitcher to pass children correctly (no `children` prop).
- Aligned Next version to 15.5.7 to eliminate SWC mismatch warning.
- Removed generated `.d.ts` artifacts from package sources and ignored nested build outputs (`.turbo`, `**/dist`, `**/.next`).

## Done Log

- 2026-02-09: Implemented Pixi'VN player MVP slice (composition contract, graph runner/storage, composition API route, Forge play modal, and tests).
- 2026-02-09: Added non-breaking Writer blocks compatibility path (blocks collection, Writer block hooks, mapper/fallback utilities, and exports).
- 2026-02-09: Added Writer docs slice for Notion SDK page/block alignment and reorder planning (63 + linked updates in 00/60/61/62/32).
- 2026-02-09: Hardened project switcher reliability with retry UX and lightweight/retryable project queries.
- 2026-02-08: Replaced Forge/Writer adapter-context flow with package-owned React Query hooks and shared payload provider.

## Next (Impact-Labeled)

1. [Large] Expand game-player template rendering: apply full directive mapping (BACKGROUND, PORTRAIT, AUDIO_CUE) from composition cues.
2. [Large] Complete dialogue-forge governance and agent-artifact parity with forge-agent (`SKILLS`, `ISSUES`, `CONTRIBUTING`, 00/18/19 docs, task registry system).
3. [Large] Integrate Writer editor/store save and hydrate flows onto block-first hooks (keep legacy `bookBody` fallback until migration cutover).
4. [Medium] Maintain and enforce collection/editor contract parity docs (`65` matrix + `66` readiness) after each schema/API slice.
5. [Medium] Add mapper/hook validation tests for legacy-to-canonical Writer content conversion.

## Handoffs / Owners
- Platform/Monorepo: keep build green, scaffold-only changes.
- Video: Twick wrapper + adapter contracts only.
- Forge/Writer/Characters/Theme/Shared: no cross-domain imports; align to new architecture doc.

## Cross-Agent Requests

- None.
