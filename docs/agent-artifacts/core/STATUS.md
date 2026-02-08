# STATUS (Living)

**Last Updated**: February 8, 2026

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

## Known Build Blockers

- `pnpm run test` is long-running in this workspace and timed out in this environment; use targeted `vitest run <path>` for quick validation while iterating.

## Studio app layout (full-height main)

For the Studio home page (`apps/studio/app/page.tsx`), the main content area must fill the viewport so workspaces (Forge, Writer, Characters) are not cut off. **Height chain:** `html, body { height: 100% }` in `apps/studio/styles/globals.css`; page root div uses `h-full min-h-0 flex flex-col`; `<main>` uses `flex-1 min-h-0`. Do not remove the html/body height or the root `h-full` or main will not get full remaining height.

## Theme Workspace + AI Footguns

- **Required env for AI routes:** `OPENROUTER_API_KEY` must be set. Provide free-model routing via `OPENROUTER_THEME_MODELS_FREE` (preferred) or free `OPENROUTER_MODEL_FAST` / `AI_DEFAULT_MODEL`.
- **Persistence contract:** Theme data is project-scoped under `projects.settings.themeWorkspace` and must be normalized through `normalizeThemeWorkspaceSettings(...)` before read/write.
- **Fallback policy:** `/api/theme/generate` and `/api/copilotkit` share one primary+fallback chain and send it to OpenRouter via the request `models` array. Avoid ad-hoc model IDs in code.
- **Vendor boundary:** `vendor/tweakcn` is not part of Studio runtime flow. Keep it as a reference/update source only.

## Recent Changes

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

## Handoffs / Owners
- Platform/Monorepo: keep build green, scaffold-only changes.
- Video: Twick wrapper + adapter contracts only.
- Forge/Writer/Characters/Theme/Shared: no cross-domain imports; align to new architecture doc.

## Cross-Agent Requests

- None.
