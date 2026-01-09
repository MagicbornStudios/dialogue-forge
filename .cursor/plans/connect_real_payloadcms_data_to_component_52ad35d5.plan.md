---
name: Connect Real PayloadCMS Data to Component
overview: Query seeded PayloadCMS data to get actual IDs, pass prepared real data to NarrativeWorkspace component instead of dummy data, and add basic loading/error handling.
todos:
  - id: query-seeded-ids
    content: Query seeded PayloadCMS data to get actual IDs (project, thread, dialogue, flag schema, game state)
    status: completed
  - id: pass-real-data
    content: Replace dummy data props with prepared PayloadCMS data in NarrativeWorkspace component (with fallbacks)
    status: completed
    dependencies:
      - query-seeded-ids
  - id: add-loading-states
    content: Add loading UI or use dummy data fallback while queries are loading
    status: completed
    dependencies:
      - query-seeded-ids
  - id: add-error-handling
    content: Add error handling with fallback to dummy data if queries fail
    status: completed
    dependencies:
      - query-seeded-ids
---

# Connect Real PayloadCMS Data to Component

## Overview

Replace dummy data with real PayloadCMS data by querying seeded data to get actual IDs, then passing the prepared data to the NarrativeWorkspace component. Add loading and error states.

## Current State

- Queries and transformers are ready
- Page queries data but still passes dummy data to component
- Seed data exists in `app/payload-seed.ts` (demo project, threads, dialogues, etc.)

## Implementation Tasks

### 1. Query Seeded Data to Get IDs

**File**: `app/(forge-app)/page.tsx`

- Query the first/default project using `useProjects()`
- Query the first thread for that project using `useThreads(projectId)`
- Query the first dialogue for that project using `useDialogues(projectId)`
- Query the first flag schema for that project using `useFlagSchemas(projectId)`
- Query the authored game state for the thread using `useGameStates({ threadId, type: 'AUTHORED' })`
- Extract IDs from query results and use them in `useWorkspaceData` and `useThreadWithAllData`

### 2. Pass Real Data to Component

**File**: `app/(forge-app)/page.tsx`

- Replace dummy `initialDialogue` with `preparedData.dialogue` (fallback to dummy if null)
- Replace dummy `demoNarrativeThread` with `preparedData.thread` (fallback to dummy if null)
- Replace dummy `demoFlagSchema` with `preparedData.flagSchema` (fallback to dummy if null)
- Replace dummy `characters` with `preparedData.characters` (fallback to dummy if empty)
- Pass `preparedData.gameState` to component (optional prop)

### 3. Add Loading State Handling

**File**: `app/(forge-app)/page.tsx`

- Show loading UI when `workspaceData.isLoading` or `threadData?.isLoading` is true
- Use dummy data as fallback while loading (so component doesn't break)
- Or show a loading spinner/placeholder

### 4. Add Error Handling

**File**: `app/(forge-app)/page.tsx`

- Check `workspaceData.isError` and `threadData?.isError`
- Display error message if queries fail
- Fallback to dummy data on error (for development)

## Data Flow

```
1. Query first project → get projectId
2. Query first thread for project → get threadId
3. Query first dialogue for project → get dialogueId
4. Query first flag schema for project → get flagSchemaId
5. Query authored game state for thread → get gameStateId
6. Use IDs in useWorkspaceData() and useThreadWithAllData()
7. Transform prepared data
8. Pass to NarrativeWorkspace component (with fallbacks)
```

## Key Implementation Details

### Getting IDs from Seeded Data

```typescript
// Query first project
const projectsQuery = useProjects()
const projectId = projectsQuery.data?.[0]?.id

// Query first thread for project
const threadsQuery = useThreads(projectId)
const threadId = threadsQuery.data?.[0]?.id

// Query first dialogue for project
const dialoguesQuery = useDialogues(projectId)
const dialogueId = dialoguesQuery.data?.[0]?.id

// Query first flag schema for project
const flagSchemasQuery = useFlagSchemas(projectId)
const flagSchemaId = flagSchemasQuery.data?.[0]?.id

// Query authored game state for thread
const gameStatesQuery = useGameStates(threadId ? { threadId, type: 'AUTHORED' } : undefined)
const gameStateId = gameStatesQuery.data?.[0]?.id
```

### Passing Data to Component

```typescript
<DialogueForge
  initialDialogue={preparedData?.dialogue || initialDialogue}
  initialThread={preparedData?.thread || demoNarrativeThread}
  flagSchema={preparedData?.flagSchema || demoFlagSchema}
  characters={Object.keys(preparedData?.characters || {}).length > 0 ? preparedData.characters : characters}
  gameState={preparedData?.gameState}
  // ... other props
/>
```

## Testing Strategy

- Verify queries return seeded data
- Check that prepared data structure matches component expectations
- Test loading states
- Test error handling
- Verify component renders with real data

## Notes

- Keep dummy data as fallback for development
- Component requires `initialThread` and `initialDialogue` (non-optional), so always provide fallbacks
- Loading states should prevent component from rendering with nul