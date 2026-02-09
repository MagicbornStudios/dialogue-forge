# Errors And Attempts

Known failure patterns and their fixes.

## 2026-02-09: React Query context split (`No QueryClient set`)

Symptom:
- Runtime error despite `QueryClientProvider` being mounted.

Cause:
- Multiple module instances of `@tanstack/react-query` due to alias resolution mismatch.

Fix:
- Keep webpack and Turbopack aliases aligned in `apps/studio/next.config.mjs`.

## 2026-02-09: Project switcher cold-start failures

Symptom:
- Project dropdown shows no projects during first load.

Cause:
- Slow first Payload init + oversized/deep query shapes.

Fix:
- Use lightweight `depth=0` project reads, retries with backoff, and manual retry action in switchers.

## 2026-02-09: Yjs duplicate import warning

Symptom:
- `Yjs was already imported... constructor checks` warning.

Cause:
- Multiple resolved module paths for Yjs packages.

Fix:
- Alias `yjs`, `y-websocket`, `y-protocols` to a single path in Next config.

## 2026-02-09: Migration doc drift

Symptom:
- Plans, STATUS, and AGENTS become inconsistent after multi-file migration slices.

Fix:
- Treat `docs/18-agent-artifacts-index.md` + `docs/19-coding-agent-strategy.md` as required update checkpoints.
- Update `MIGRATION.md` and relevant plan docs in the same slice.

## 2026-02-09: Pixi'VN runtime initialization hazards

Symptom:
- Player shell crashes or silently fails when Pixi APIs are evaluated during SSR.

Cause:
- Canvas/runtime modules (`pixi.js`, `@drincs/pixi-vn`) were initialized outside client-only lifecycle.

Fix:
- Keep shell in `'use client'` components.
- Load Pixi modules inside `useEffect` via dynamic import.
- Surface non-fatal UI error if init fails and keep overlay controls active.
