# Environment Variables

All environment variables are documented in `.env.example` with inline comments. Copy `.env.example` to `.env.local` and fill in your values.

## Quick Setup

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

## Variable Categories

### OpenRouter API (Required for AI Features)

- **`OPENROUTER_API_KEY`** (Required)
  - Your OpenRouter API key for AI model access
  - Get one at: https://openrouter.ai/
  - Used by CopilotKit, Writer AI, and Forge AI assistance

- **`OPENROUTER_BASE_URL`** (Optional)
  - Override OpenRouter base URL
  - Default: `https://openrouter.ai/api/v1`

- **`AI_MODEL_CHEAP`** (Optional)
  - Fast, cheap model for simple tasks
  - Example: `openai/gpt-4o-mini`

- **`AI_MODEL_DEFAULT`** (Optional)
  - Default model for general use
  - Example: `openai/gpt-4o`

- **`AI_MODEL_REASONING`** (Optional)
  - Reasoning model for complex tasks
  - Example: `openai/o1-mini`

### AI Runtime Configuration

- **`AI_TEMPERATURE`** (Optional, Default: `0.7`)
  - Temperature for AI responses (0.0-2.0)
  - Lower = more focused, Higher = more creative

- **`AI_MAX_OUTPUT_TOKENS`** (Optional, Default: `1024`)
  - Maximum tokens in AI response

- **`AI_REQUEST_TIMEOUT_MS`** (Optional, Default: `60000`)
  - Request timeout in milliseconds (60000 = 60 seconds)

- **`AI_SERVER_APPLY_ENABLED`** (Optional, Default: `false`)
  - Enable/disable AI server apply functionality
  - When enabled, AI can directly apply changes to your codebase
  - **Warning**: Use with caution in production

### OpenCode Integration

- **`NEXT_PUBLIC_OPENCODE_UI_DEV_URL`** (Optional)
  - Development: URL to OpenCode UI dev server for hot reload
  - Set this when running: `npm run vendor:opencode:dev`
  - Example: `http://localhost:5173`
  - Leave empty or unset to use production static build from `public/vendor/opencode`

### PayloadCMS Configuration

- **`PAYLOAD_PUBLIC_SERVER_URL`** (Optional, Default: `http://localhost:3000`)
  - Server URL for PayloadCMS
  - Used for API endpoints and admin panel

- **`PAYLOAD_SECRET`** (Required in production)
  - Secret key for PayloadCMS encryption
  - Generate a secure random string for production use
  - Default in dev: `dev-secret-change-me` (CHANGE THIS!)

### CopilotKit Cloud (Optional)

- **`NEXT_PUBLIC_COPILOTKIT_API_KEY`** (Optional)
  - Only needed if using CopilotKit Cloud
  - We use self-hosted runtime by default, so this is usually not needed

## Environment File Priority

Next.js loads environment variables in this order (later files override earlier ones):

1. `.env` - Default values for all environments
2. `.env.local` - Local overrides (gitignored, contains secrets)
3. `.env.development` / `.env.production` - Environment-specific
4. `.env.development.local` / `.env.production.local` - Environment-specific local overrides

**Best Practice**: Use `.env.local` for all your actual secrets and configuration.

## Client vs Server Variables

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Variables without the prefix are server-only (more secure)
- Never put secrets in `NEXT_PUBLIC_*` variables

## See Also

- [CopilotKit Setup](./copilotkit-setup.md) - Detailed AI setup
- [OpenCode Integration](./opencode-integration.md) - OpenCode configuration
