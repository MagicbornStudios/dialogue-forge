---
name: Payload Queries + Event Handlers
overview: Create PayloadCMS queries using SDK with React Query, set up event handlers that connect events to database operations, and wire everything together.
todos:
  - id: react-query-provider
    content: Set up React Query Provider in app/layout.tsx
    status: completed
  - id: payload-client
    content: Create Payload SDK client utility in app/lib/forge/payload-client.ts
    status: completed
  - id: queries-file
    content: Create queries.ts with React Query hooks for dialogues, pages, storylet templates, and narrative elements
    status: completed
    dependencies:
      - payload-client
  - id: dialogue-handlers
    content: Create dialogue-handlers.ts with dialogue.openRequested and dialogue.changed handlers
    status: completed
    dependencies:
      - queries-file
  - id: storylet-handlers
    content: Create storylet-handlers.ts with storyletTemplate.openRequested handler
    status: completed
    dependencies:
      - queries-file
  - id: narrative-handlers
    content: Create narrative-handlers.ts with narrative.select handler
    status: completed
    dependencies:
      - queries-file
  - id: handlers-index
    content: Create handlers/index.ts to export all handlers
    status: completed
    dependencies:
      - dialogue-handlers
      - storylet-handlers
      - narrative-handlers
  - id: wire-handlers
    content: Update forge-event-handlers.ts to integrate default handlers with queries
    status: completed
    dependencies:
      - handlers-index
  - id: integrate-page
    content: Update app/(forge-app)/page.tsx to use handlers with queries
    status: completed
    dependencies:
      - wire-handlers
---

# Payload Queries + Event Handlers Integration

## Overview

Create a complete data layer using Payload SDK with React Query for caching, then implement event handlers that connect Dialogue Forge events to PayloadCMS database operations.

## Architecture

```
NarrativeWorkspace (dispatches events)
  ↓
forge-event-handlers.ts (routes events)
  ↓
forge/handlers/ (event handlers)
  ↓
forge/queries.ts (React Query hooks)
  ↓
Payload SDK → PayloadCMS API
```

## Implementation Tasks

### 1. Set Up React Query Provider

**File**: `app/layout.tsx`

- Import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`
- Create QueryClient instance with default options
- Wrap children with QueryClientProvider (only for non-Payload routes)
- Ensure provider doesn't interfere with Payload admin routes

### 2. Create Payload SDK Client Utility

**File**: `app/lib/forge/payload-client.ts` (new)

- Create `getPayloadClient()` function using `@payloadcms/sdk`
- Configure with server URL from environment
- Export singleton client instance
- Handle both server and client contexts

### 3. Create Payload Queries with React Query

**File**: `app/lib/forge/queries.ts`

- **Query Keys**: Create query key factory functions for all collections
- **Dialogues**:
  - `useDialogue(dialogueId)` - Get dialogue by ID
  - `useDialogues(projectId?)` - List dialogues (optional project filter)
  - `useCreateDialogue()` - Create mutation
  - `useUpdateDialogue()` - Update mutation
  - Extract `DialogueTree` from `tree` JSON field
- **Pages**:
  - `usePage(pageId)` - Get page by ID
  - `usePageByDialogueId(dialogueId)` - Get page that uses dialogue
  - `useUpdatePage()` - Update mutation (for dialogueId denormalization)
- **Storylet Templates**:
  - `useStoryletTemplate(templateId)` - Get template by ID
  - Include dialogue relationship expansion
- **Narrative Elements** (for narrative.select event):
  - `useAct(actId)` - Get act by ID
  - `useChapter(chapterId)` - Get chapter by ID
  - `usePage(pageId)` - Already created above
- **Query Options**:
  - Stale time: 5 minutes for reads
  - Cache time: 10 minutes
  - Retry: 2 attempts
  - Refetch on window focus: false (for editor)

### 4. Create Event Handlers

**File**: `app/lib/forge/handlers/dialogue-handlers.ts` (new)

- **dialogue.openRequested handler**:
  - Use `useDialogue` query (or fetch directly)
  - Return DialogueTree from `tree` field
  - Handle not found errors
- **dialogue.changed handler**:
  - Use `useUpdateDialogue` mutation
  - Save DialogueTree to `tree` JSON field
  - Update `startNodeId` denormalized field
  - Invalidate dialogue cache
  - Optionally update related pages if dialogueId changed

**File**: `app/lib/forge/handlers/storylet-handlers.ts` (new)

- **storyletTemplate.openRequested handler**:
  - Use `useStoryletTemplate` query
  - Fetch template with dialogue relationship
  - Return template data

**File**: `app/lib/forge/handlers/narrative-handlers.ts` (new)

- **narrative.select handler**:
  - Based on `elementType`, fetch act/chapter/page
  - Use appropriate query hook
  - Store selection in local state or context (if needed)

**File**: `app/lib/forge/handlers/index.ts` (new)

- Export all handlers
- Create handler map type
- Provide convenience function to create all handlers

### 5. Wire Up Handlers in Event System

**File**: `app/lib/forge-event-handlers.ts`

- Import handlers from `forge/handlers`
- Update `createForgeEventHandlers` to accept optional handler overrides
- Create default handlers that use queries
- Export `useForgeEventHandlersWithDefaults()` hook that includes all default handlers

**File**: `app/(forge-app)/page.tsx`

- Import `useForgeEventHandlersWithDefaults`
- Set up handlers with queries
- Pass `onEvent` to NarrativeWorkspace
- Handle loading/error states

### 6. Type Safety

- Create TypeScript types for Payload collection documents
- Type query return values
- Type mutation inputs/outputs
- Ensure DialogueTree type matches Payload `tree` field structure

## File Structure

```
app/lib/forge/
├── payload-client.ts          # Payload SDK client setup
├── queries.ts                 # React Query hooks for all collections
├── handlers/
│   ├── dialogue-handlers.ts   # dialogue.* event handlers
│   ├── storylet-handlers.ts   # storyletTemplate.* handlers
│   ├── narrative-handlers.ts  # narrative.select handler
│   └── index.ts               # Export all handlers
└── types.ts                   # Payload-specific types (optional)
```

## Key Implementation Details

### Payload Client Setup

```typescript
import { getPayload } from '@payloadcms/sdk'
import config from '@payload-config'

export async function getPayloadClient() {
  return getPayload({ config })
}
```

### Query Example (Dialogues)

```typescript
export function useDialogue(dialogueId: string | null) {
  return useQuery({
    queryKey: ['dialogues', dialogueId],
    queryFn: async () => {
      const payload = await getPayloadClient()
      const doc = await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.DIALOGUES,
        id: dialogueId,
      })
      return doc.tree as DialogueTree
    },
    enabled: !!dialogueId,
    staleTime: 5 * 60 * 1000,
  })
}
```

### Handler Example (dialogue.changed)

```typescript
export function createDialogueChangedHandler(
  updateDialogue: UseMutationResult<...>
) {
  return async (event: DialogueForgeEvent & { type: 'dialogue.changed' }) => {
    await updateDialogue.mutateAsync({
      id: event.payload.dialogueId,
      tree: event.payload.dialogue,
      startNodeId: event.payload.dialogue.startNodeId,
    })
  }
}
```

## Testing Considerations

- Test queries with mock Payload client
- Test handlers with mock mutations
- Test React Query cache invalidation
- Test error handling in handlers

## Notes

- Payload SDK `getPayload` works in both server and client contexts
- React Query handles caching, refetching, and error states
- DialogueTree is stored in `tree` JSON field in dialogues collection
- `dialogueId` in events maps to Payload document `id` (not a separate field)
- Handlers should be pure functions that use injected query hooks
- Consider debouncing `dialogue.changed` events to avoid excessive saves