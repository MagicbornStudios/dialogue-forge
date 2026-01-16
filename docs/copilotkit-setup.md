# CopilotKit Setup

CopilotKit is integrated into both the Writer and Forge workspaces to provide AI assistance.

## Environment Variables

### Required

- **`OPENROUTER_API_KEY`**: Your OpenRouter API key for AI model access
  - Get one at: https://openrouter.ai/
  - Used by the CopilotKit runtime at `/api/copilotkit`

### Optional

- **`NEXT_PUBLIC_COPILOTKIT_API_KEY`**: CopilotKit Cloud API key (optional)
  - Only needed if using CopilotKit Cloud features
  - For self-hosted runtime (which we use), this is not required

### Additional OpenRouter Configuration (Optional)

- **`OPENROUTER_BASE_URL`**: Override OpenRouter base URL (default: `https://openrouter.ai/api/v1`)
- **`OPENROUTER_MODEL_FAST`**: Model for fast responses (default: `openai/gpt-4o-mini`)
- **`OPENROUTER_MODEL_REASONING`**: Model for complex reasoning (default: `openai/o1-mini`)
- **`OPENROUTER_TIMEOUT_MS`**: Request timeout in milliseconds (default: `60000`)

## Setup Steps

1. **Add environment variables to `.env.local`**:
   ```bash
   OPENROUTER_API_KEY=your_openrouter_key_here
   # NEXT_PUBLIC_COPILOTKIT_API_KEY=optional_copilotkit_key  # Only if using CopilotKit Cloud
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

3. **Verify the API route is working**:
   - The CopilotKit runtime should be available at `/api/copilotkit`
   - Check browser console for any errors

## How It Works

1. **Writer Workspace**: Uses `CopilotKitWorkspaceProvider` which includes context and actions
2. **Forge Workspace**: Uses `CopilotKitProvider` with actions registered via `useForgeWorkspaceActions`

Both workspaces register their actions automatically when the workspace components mount.

## Troubleshooting

### Error: "Cannot read properties of null (reading 'subscribe')"

This usually means:
- CopilotKit provider is missing (check that workspace is wrapped in `CopilotKitProvider`)
- Environment variables are not set correctly
- API route is not accessible

### Error: "OpenRouter API key not configured"

- Make sure `OPENROUTER_API_KEY` is set in `.env.local`
- Restart the dev server after adding environment variables

### CopilotKit sidebar not appearing

- Check browser console for errors
- Verify `NEXT_PUBLIC_COPILOTKIT_API_KEY` is set if using CopilotKit Cloud
- For self-hosted runtime, the sidebar should work without the public API key
