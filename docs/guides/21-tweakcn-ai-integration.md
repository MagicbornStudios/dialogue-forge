---
title: 21 - Theme workspace + AI integration
created: 2026-02-08
updated: 2026-02-08
---

# 21 - Theme workspace + AI integration

## What

Theme generation is now first-class inside Studio through `ThemeWorkspace` (`@magicborn/theme`) with project-scoped persistence and OpenRouter free-model routing.

## Architecture

- Workspace package: `packages/theme`
- Studio integration: `apps/studio/app/page.tsx` (`theme` tab) and `apps/studio/app/theme/page.tsx`
- Data adapter: `apps/studio/lib/theme/ThemeDataProvider.tsx`
- Persistence: `projects.settings.themeWorkspace` (`ThemeWorkspaceSettingsV1`)
- AI endpoint: `POST /api/theme/generate`
- Copilot parity endpoint: `POST /api/copilotkit`

## OpenRouter Policy

- Required env:
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_THEME_MODELS_FREE` (preferred, comma-separated `:free` model IDs)
  - or free `OPENROUTER_MODEL_FAST` / `AI_DEFAULT_MODEL` as fallback chain sources
- Non-free models are rejected by policy.
- `/api/theme/generate` and `/api/copilotkit` use the same primary + fallback chain.
- OpenRouter fallback is driven by sending `models: [primary, ...fallbacks]` on generation requests.

## Minimal Flow

1. Open Studio and switch to `Theme` tab (or `/theme`).
2. Select/create a project.
3. Edit tokens or ask AI to generate a theme.
4. Theme is auto-saved under `projects.settings.themeWorkspace`.
5. Copy generated `index.css` / `tailwind.config` from code panel.

## Related

- `20-vendor-tweakcn.md`
- `15-install-from-local-registry.md`
- `../plans/tweakcn-vendor-and-ai.md`
