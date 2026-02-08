# STATUS (Living)

**Last Updated**: February 8, 2026

## Monorepo Migration Phases (Inline Status)

- Phase 0: Conventions + target architecture docs - DONE
- Phase 1: Workspace scaffolding (apps/ + packages/ + tooling) - DONE
- Phase 2: Domain package extraction - IN PROGRESS
- Phase 3: Tooling + guardrails (dependency rules, CI) - IN PROGRESS
- Phase 4: Publishing flow (multi-package) - NOT STARTED

## Current Repo State

- Build: `pnpm run build` - PASS (via Turbo)
- Typecheck: `npm run typecheck:domains` - PASS
- Typecheck: `npm run typecheck:host` - PASS
- Package manager: pnpm (installed via official script); `packageManager` field set in root `package.json`
- If `pnpm` isn't found in a new shell, restart the terminal (installer updates PATH).
- Build notes:
  - Next.js pinned to 15.5.7 to match published `@next/swc` binaries.
  - pnpm reported ignored build scripts (run `pnpm approve-builds` only if native deps break).
- Root package is `private` and uses Turborepo scripts
- Host app lives in `apps/host`
- Domain source lives in `packages/{shared,forge,writer,video,characters,ai}`
- Umbrella package lives in `packages/dialogue-forge`
- `@/` path alias removed from code; use `@magicborn/<domain>/*` + relative host imports

## Decisions Locked
- Video workspace is Twick-only. Legacy video workspace is removed.
- No draft slices and no event bus in new or refactored workspace architecture.
- `packages/**` must never import `apps/host/**` or `apps/host/app/payload-types.ts`.
- Adapters are contracts in packages; host implements them.
- Use constants for discriminated types (no string literals).
- No @/ alias in code; use @magicborn/<domain>/* or relative paths.

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

- `pnpm run typecheck:domains` fails in `packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/SpeechToTextPlugin/index.ts` because `window.SpeechRecognition` is not declared on `Window`.
- `pnpm run typecheck:domains` fails in `packages/dialogue-forge/src/index.ts` due missing `@magicborn/forge/*` module export targets (multiple `TS2307` unresolved paths).

## Studio app layout (full-height main)

For the Studio home page (`apps/studio/app/page.tsx`), the main content area must fill the viewport so workspaces (Forge, Writer, Characters) are not cut off. **Height chain:** `html, body { height: 100% }` in `apps/studio/styles/globals.css`; page root div uses `h-full min-h-0 flex flex-col`; `<main>` uses `flex-1 min-h-0`. Do not remove the html/body height or the root `h-full` or main will not get full remaining height.

## Vendor tweakcn (Studio integration)

When Studio builds code under `vendor/tweakcn` (e.g. middleware, auth, mail example):

- **@neondatabase/serverless**: Resolved from workspace root. `drizzle-orm` (used by `vendor/tweakcn/db`) pulls in `neon-http/driver.js`, which requires `@neondatabase/serverless`. **Fix:** Add `@neondatabase/serverless` to `apps/studio/package.json` so the module resolves at build time. Run `pnpm install --no-frozen-lockfile` after adding.
- **react-resizable-panels v4**: Workspace uses v4 (`Group`, `Panel`, `Separator`; `PanelImperativeHandle`). Tweakcn was written for v2 (`PanelGroup`, `PanelResizeHandle`, `ImperativePanelHandle`). **Fix:** In `vendor/tweakcn`: (1) `components/ui/resizable.tsx` — use `Group`, `Panel`, `Separator`; map `direction` → `orientation`; forward `ref` to `Panel`’s `panelRef`. (2) `components/block-viewer.tsx` — use type `PanelImperativeHandle` and pass ref to `ResizablePanel` (which forwards to `panelRef`).

## Recent Changes

- Studio main content full height: set `html, body { height: 100% }` in apps/studio/styles/globals.css and page root to `h-full min-h-0` so the main (flex-1) gets the full remaining viewport instead of being cut off.
- Forge workspace: wrapped `ForgeWorkspaceLayout` in a container with `flex-1 min-h-0 overflow-hidden` so the layout gets bounded height and the bottom (storylet) panel is visible instead of being cut off.
- Fixed Studio build when compiling vendor/tweakcn: added `@neondatabase/serverless` to apps/studio; updated vendor/tweakcn resizable UI and block-viewer to react-resizable-panels v4 API (Group/Panel/Separator, PanelImperativeHandle, direction→orientation, ref→panelRef). Documented in STATUS (Vendor tweakcn), 20-vendor-tweakcn (Troubleshooting), and plans/tweakcn-vendor-and-ai.md (Resolved).
- Added numbered consumer/playground docs under `docs/guides/` aligned with forge-agent flow (01, 05, 15, 20, 21).
- Added consumer registry guide for `@forge/*` and `@twick/*` install from local Verdaccio.
- Added `vendor/tweakcn` submodule wiring plus root scripts for install/dev/build/update.
- Added Studio `tweakcn + AI` touchpoint: `/tweakcn-ai` UI and `POST /api/tweakcn/ai` OpenRouter endpoint.
- Updated migration agent strategy doc with explicit consumer/playground alignment to forge-agent.
- Domain packages extracted to `packages/{shared,forge,writer,video,characters,ai}`.
- Runtime package removed; runtime types remain in shared.
- Host app now depends on domain packages (`@magicborn/<domain>`).
- `@/` imports removed from code; host uses `@magicborn/<domain>/*` + relative paths.
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
- Ignored host app media uploads under `apps/host/app/media/` to prevent repo bloat.

## Handoffs / Owners
- Platform/Monorepo: keep build green, scaffold-only changes.
- Video: Twick wrapper + adapter contracts only.
- Forge/Writer/Characters/Shared: no cross-domain imports; align to new architecture doc.

## Cross-Agent Requests

- None.
