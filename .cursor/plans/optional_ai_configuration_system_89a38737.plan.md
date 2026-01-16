---
name: Optional AI Configuration System
overview: Create a three-tier configuration system (Global → Workspace → Project) to make AI/CopilotKit optional, preventing errors when not configured while allowing granular control per workspace and project.
todos:
  - id: phase1-api
    content: Update API route to handle missing keys gracefully
    status: pending
  - id: phase1-provider
    content: Make CopilotKitProvider conditional with enabled prop
    status: pending
  - id: phase2-global
    content: Create global AI configuration types and utilities
    status: pending
  - id: phase2-slices
    content: Add AI config slices to Forge and Writer workspace stores
    status: pending
    dependencies:
      - phase2-global
  - id: phase2-hook
    content: Create useAiConfig hook for merged configuration
    status: pending
    dependencies:
      - phase2-global
      - phase2-slices
  - id: phase3-forge
    content: Integrate AI config into ForgeWorkspace
    status: pending
    dependencies:
      - phase1-provider
      - phase2-hook
  - id: phase3-writer
    content: Integrate AI config into WriterWorkspace
    status: pending
    dependencies:
      - phase1-provider
      - phase2-hook
  - id: phase3-sync
    content: Update ProjectSync to load project AI settings
    status: pending
    dependencies:
      - phase2-hook
  - id: phase4-schema
    content: Add project settings schema and type hints
    status: pending
  - id: phase4-adapter
    content: Create project settings adapter for PayloadCMS
    status: pending
    dependencies:
      - phase4-schema
---

# Optional AI Configuration System

## Problem Statement

Currently, CopilotKit initializes even when not configured, causing runtime errors. We need:

1. AI to be optional and gracefully disabled when not configured
2. Three-tier configuration: Global (env/code) → Workspace → Project
3. Per-project settings stored in PayloadCMS `project.settings` JSON
4. Workspace-level configuration slices in store
5. API route that handles missing keys gracefully

## Architecture Overview

```
Configuration Hierarchy (highest to lowest priority):
1. Project Settings (PayloadCMS project.settings.ai)
2. Workspace Settings (store slice)
3. Global Settings (env vars + code defaults)
```

## Implementation Plan

### Phase 1: Make CopilotKit Optional (Fix Current Errors)

**1.1 Update API Route to Handle Missing Keys**

- File: `app/api/copilotkit/route.ts`
- Change: Return 503 or graceful error instead of throwing
- Check: `getOpenRouterConfig().apiKey` exists before initializing runtime
- If missing: Return JSON error response instead of throwing

**1.2 Make CopilotKitProvider Conditional**

- File: `src/ai/copilotkit/providers/CopilotKitProvider.tsx`
- Add: `enabled` prop (default: check if API key exists)
- Change: Only render `<CopilotKit>` if enabled
- Fallback: Render children without CopilotKit wrapper if disabled

**1.3 Update Workspace Components**

- Files: 
  - `src/forge/components/ForgeWorkspace/ForgeWorkspace.tsx`
  - `src/writer/components/WriterWorkspace/WriterWorkspace.tsx`
- Change: Conditionally wrap with `CopilotKitProvider` based on configuration
- Use: New configuration system (Phase 2) to determine if enabled

### Phase 2: Create Configuration System

**2.1 Global Configuration Type & Utilities**

- New file: `src/shared/config/ai-config.ts`
- Define: `AiConfig` type with three levels
- Functions:
  - `getGlobalAiConfig()`: Read from env vars
  - `isAiEnabledGlobally()`: Check if global config allows AI
  - `mergeAiConfig()`: Merge configs with priority (project > workspace > global)

**2.2 Workspace Configuration Slices**

- Files:
  - `src/forge/components/ForgeWorkspace/store/slices/ai-config.slice.ts`
  - `src/writer/components/WriterWorkspace/store/slices/ai-config.slice.ts`
- Add slices with:
  - `aiEnabled: boolean`
  - `aiProvider?: 'copilotkit' | 'custom'`
  - `aiSettings?: Record<string, unknown>`
- Actions: `setAiEnabled`, `setAiSettings`

**2.3 Project Settings Type**

- File: `app/payload-collections/collection-configs/projects.ts`
- Update: Add TypeScript type for `settings.ai` structure
- Structure:
  ```typescript
  interface ProjectAiSettings {
    enabled?: boolean;
    provider?: 'copilotkit' | 'custom';
    workspaceSettings?: {
      writer?: { enabled?: boolean };
      forge?: { enabled?: boolean };
    };
    customSettings?: Record<string, unknown>;
  }
  ```


**2.4 Configuration Hook**

- New file: `src/shared/hooks/useAiConfig.ts`
- Purpose: Central hook to get merged AI configuration
- Input: `projectId`, `workspaceType` ('writer' | 'forge')
- Output: `{ enabled: boolean, config: AiConfig }`
- Logic: Merge global → workspace → project settings

### Phase 3: Integrate Configuration into Workspaces

**3.1 Update ForgeWorkspace**

- File: `src/forge/components/ForgeWorkspace/ForgeWorkspace.tsx`
- Add: `useAiConfig` hook with `selectedProjectId` and `'forge'`
- Conditionally render `CopilotKitProvider` based on `enabled`
- Pass workspace store to AI config slice

**3.2 Update WriterWorkspace**

- File: `src/writer/components/WriterWorkspace/WriterWorkspace.tsx`
- Same pattern as ForgeWorkspace
- Use `useAiConfig` with `'writer'` workspace type

**3.3 Update Project Sync**

- Files:
  - `src/forge/components/ForgeWorkspace/components/ProjectSync.tsx`
  - Similar for Writer if exists
- Load project settings from PayloadCMS
- Update workspace AI config slice when project changes

### Phase 4: PayloadCMS Integration

**4.1 Project Settings Schema**

- File: `app/payload-collections/collection-configs/projects.ts`
- Add: Admin UI hints for `settings` field
- Optional: Add validation for `settings.ai` structure

**4.2 Settings Adapter**

- New file: `app/lib/config/project-settings-adapter.ts`
- Functions:
  - `getProjectAiSettings(projectId)`: Fetch from PayloadCMS
  - `updateProjectAiSettings(projectId, settings)`: Update in PayloadCMS
  - `getDefaultProjectAiSettings()`: Return defaults

### Phase 5: UI Controls (Optional - Future)

**5.1 Settings UI**

- Add toggle in workspace menu/settings to enable/disable AI
- Store in workspace slice (persists to localStorage)
- Optionally sync to project settings

## File Changes Summary

### New Files

- `src/shared/config/ai-config.ts` - Configuration types and utilities
- `src/shared/hooks/useAiConfig.ts` - Configuration hook
- `src/forge/components/ForgeWorkspace/store/slices/ai-config.slice.ts` - Forge AI config slice
- `src/writer/components/WriterWorkspace/store/slices/ai-config.slice.ts` - Writer AI config slice
- `app/lib/config/project-settings-adapter.ts` - PayloadCMS settings adapter

### Modified Files

- `app/api/copilotkit/route.ts` - Graceful error handling
- `src/ai/copilotkit/providers/CopilotKitProvider.tsx` - Add `enabled` prop
- `src/forge/components/ForgeWorkspace/ForgeWorkspace.tsx` - Conditional CopilotKit
- `src/writer/components/WriterWorkspace/WriterWorkspace.tsx` - Conditional CopilotKit
- `src/forge/components/ForgeWorkspace/store/forge-workspace-store.tsx` - Add AI config slice
- `src/writer/components/WriterWorkspace/store/writer-workspace-store.tsx` - Add AI config slice
- `src/forge/components/ForgeWorkspace/components/ProjectSync.tsx` - Load project AI settings
- `app/payload-collections/collection-configs/projects.ts` - Add settings type hints

## Configuration Priority Logic

```typescript
function isAiEnabled(global, workspace, project, workspaceType) {
  // Project-level override (highest priority)
  if (project?.workspaceSettings?.[workspaceType]?.enabled !== undefined) {
    return project.workspaceSettings[workspaceType].enabled;
  }
  if (project?.enabled !== undefined) {
    return project.enabled;
  }
  
  // Workspace-level
  if (workspace?.enabled !== undefined) {
    return workspace.enabled;
  }
  
  // Global-level (default: enabled if API key exists)
  return global.enabled && global.apiKeyConfigured;
}
```

## Default Behavior

- **Global**: Enabled if `OPENROUTER_API_KEY` is set
- **Workspace**: Inherits from global (no override by default)
- **Project**: Inherits from workspace (no override by default)
- **Result**: AI works out-of-the-box when API key is configured, but can be disabled at any level

## Testing Strategy

1. Test with no API key: Should not crash, AI disabled
2. Test with API key: Should work by default
3. Test workspace-level disable: Should disable for that workspace
4. Test project-level disable: Should disable for that project only
5. Test project-level enable: Should enable even if workspace disabled