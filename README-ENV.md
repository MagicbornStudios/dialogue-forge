# Environment Variables Setup

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual values (this file is gitignored)

3. **Required variables:**
   - `OPENROUTER_API_KEY` - Get from https://openrouter.ai/
   - `PAYLOAD_SECRET` - Change from default in production!

## Documentation

- **`.env.example`** - Template with inline documentation for all variables
- **[docs/environment-variables.md](docs/environment-variables.md)** - Detailed documentation

## Variable Categories

- **OpenRouter API** - Required for AI features
- **AI Runtime** - Temperature, tokens, timeouts
- **OpenCode Integration** - Dev server URL for hot reload
- **PayloadCMS** - Database and admin configuration
- **CopilotKit Cloud** - Optional cloud features

See `.env.example` for complete inline documentation.
