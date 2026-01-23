# AI

## Overview
The AI layer provides shared infrastructure, adapters, and CopilotKit integration used by both Forge and Writer workspaces.

## Tech Stack
AI features in Dialogue Forge are powered by:
- **CopilotKit** for UI and runtime orchestration.
- **OpenAI/OpenRouter integrations** via `@ai-sdk/openai`, `ai`, and `openai` dependencies.

## Core AI Infrastructure
- **AI data adapter contract**: `AiDataAdapter` defines the interface for configuring API keys, testing connectivity, and optionally logging request/response history.
- **CopilotKit integration**: Both Forge and Writer workspaces use CopilotKit providers/actions, with configuration detailed in the CopilotKit setup guide.

## How It Looks
AI assistance appears as a Copilot sidebar that can be toggled from the Forge workspace:
- **Copilot button**: A hover-revealed button with keyboard hints for opening the assistant.
- **Copilot sidebar**: The modal controller toggles the sidebar rendered by CopilotKit.

## Configuration & Environment
AI features depend on OpenRouter configuration, documented in the environment variable reference and CopilotKit setup guides.

## Where to Add New AI Features
- **Shared adapters or contracts** → `src/ai/`
- **Forge- or Writer-specific AI workflows** → add adapters/actions in the respective domain while honoring the architecture boundaries.

## Architecture Graphs
The latest generated dependency graphs and reports live in:
- `docs/architecture/graphs/dependency-cruiser.mmd` (Mermaid)
- `docs/architecture/graphs/dependency-cruiser.d2` (D2)
- `docs/architecture/graphs/madge.json` (Madge dependency map)
- `docs/architecture/dependency-cruiser.json` (raw cruise output)
- `docs/architecture/latest-analysis.md` (summary report)

## Related Docs
- [CopilotKit Setup](./copilotkit-setup.md)
- [Environment Variables](./environment-variables.md)
- [Architecture Boundaries](./architecture/BOUNDARIES.md)
- [Architecture Graphs](./architecture/graphs/README.md)
