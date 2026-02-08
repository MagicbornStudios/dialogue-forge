---
title: 20 - Vendor tweakcn
created: 2026-02-08
updated: 2026-02-08
---

# 20 - Vendor tweakcn

## What

Vendor `tweakcn` as a submodule and run it as a standalone app while integrating it with Studio as a linked tool.

## Prerequisites

- Submodule exists at `vendor/tweakcn`.
- Root scripts are available for install/dev/build.

## Steps

1. Initialize/update vendor code:

```bash
git submodule update --init --recursive
```

2. Install tweakcn dependencies:

```bash
pnpm run vendor:tweakcn:install
```

3. Run tweakcn app:

```bash
pnpm run vendor:tweakcn:dev
```

4. Open Studio helper page:
- `/tweakcn-ai` in this repo.

5. Optional update helper:

```bash
pnpm run vendor:tweakcn:update
```

## Integration

- Integration mode is separate app (new tab / separate server).
- Studio links out to local tweakcn and also provides an AI suggestion panel that can be copied into tweakcn.

## Troubleshooting (Studio build)

If Studio build fails while compiling `vendor/tweakcn`:

- **Module not found: `@neondatabase/serverless`** — Add it to `apps/studio/package.json` dependencies, then run `pnpm install --no-frozen-lockfile` at repo root.
- **Export `PanelResizeHandle` doesn't exist** — Workspace uses `react-resizable-panels` v4; tweakcn’s resizable UI was written for v2. Use v4 API in `vendor/tweakcn/components/ui/resizable.tsx` (`Group`, `Panel`, `Separator`; `orientation` not `direction`) and in `block-viewer.tsx` use `PanelImperativeHandle` and forward ref via `panelRef`. See STATUS “Vendor tweakcn” for details.

## Related

- `21-tweakcn-ai-integration.md`
- `15-install-from-local-registry.md`
- `docs/agent-artifacts/core/STATUS.md` (Vendor tweakcn build fixes)
