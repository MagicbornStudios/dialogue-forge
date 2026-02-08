---
title: 20 - Vendor tweakcn (reference only)
created: 2026-02-08
updated: 2026-02-08
---

# 20 - Vendor tweakcn (reference only)

## What

`vendor/tweakcn` is kept as an upstream reference submodule, not as a Studio runtime dependency.

## Why

- Studio now uses first-class theme integration in `packages/theme`.
- We avoid carrying runtime/auth/db coupling from the full tweakcn app.
- This repo remains a consumer/playground that can upstream stable patterns to `forge-agent`.

## Steps

1. Initialize or update the submodule:

```bash
git submodule update --init --recursive
```

2. Run tweakcn standalone only when you need upstream reference checks:

```bash
pnpm run vendor:tweakcn:install
pnpm run vendor:tweakcn:dev
```

3. Update submodule pointer when pulling upstream changes:

```bash
pnpm run vendor:tweakcn:update
```

## Runtime Rule

- Do not route Studio users through `vendor/tweakcn`.
- Theme editing/generation happens in Studio `ThemeWorkspace` (`@magicborn/theme`).

## Related

- `21-tweakcn-ai-integration.md`
- `15-install-from-local-registry.md`
- `docs/agent-artifacts/core/STATUS.md`
