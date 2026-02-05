# STATUS (Living)

**Last Updated**: February 4, 2026

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
- If `pnpm` isn’t found in a new shell, restart the terminal (installer updates PATH).
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

## Recent Changes

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


