---
title: 21 - Tweakcn + AI integration
created: 2026-02-08
updated: 2026-02-08
---

# 21 - Tweakcn + AI integration

## What

Minimal AI touchpoint for tweakcn using OpenRouter through Studio API.

## Prerequisites

- `OPENROUTER_API_KEY` set in `apps/studio/.env.local`.
- Studio running.

## Steps

1. Open `/tweakcn-ai` in Studio.
2. Enter a theme prompt.
3. Submit to `POST /api/tweakcn/ai`.
4. Copy returned suggestion JSON/text into tweakcn workflow.

## Implementation

- UI: `apps/studio/app/tweakcn-ai/page.tsx`
- API: `apps/studio/app/api/tweakcn/ai/route.ts`
- Provider/runtime note: `packages/ai/src/copilotkit/providers/CopilotKitProvider.tsx` still points to `/api/copilotkit`; this repo currently exposes a focused tweakcn AI endpoint first.

## Related

- `20-vendor-tweakcn.md`
- `../how-to/adding-ai-to-workspaces.md`
