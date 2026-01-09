---
name: Host App Data Integration
overview: Query PayloadCMS collections, create transformation utilities to convert Payload data to forge component formats, and set up the host app page to fetch and prepare data (while still using dummy data for now).
todos:
  - id: extend-queries
    content: Extend queries.ts with hooks for threads, flag schemas, characters, game states, storylet pools, and projects
    status: pending
  - id: create-types
    content: Create app/lib/forge/types.ts with TypeScript interfaces for all PayloadCMS document types
    status: pending
  - id: create-transformers
    content: Create app/lib/forge/transformers.ts with transformation functions to convert Payload data to forge component formats
    status: pending
    dependencies:
      - create-types
  - id: composite-queries
    content: Add composite query hooks (useThreadWithAllData, useWorkspaceData) that fetch related data together
    status: pending
    dependencies:
      - extend-queries
  - id: update-page
    content: Update app/(forge-app)/page.tsx to query and transform data, keeping dummy data for component but having real data ready
    status: pending
    dependencies:
      - create-transformers
      - composite-queries
---

# Host App Data Integration

## Overview

Query PayloadCMS collections, create transformation utilities to convert Payload data structures to the formats expected by the forge component (StoryThread, DialogueTree, FlagSchema, Characters, GameState), and set up the host app to fetch and prepare this data. Keep passing dummy data to the component for now, but have the real data ready.

## Data Flow

```
PayloadCMS Collections
  ↓
React Query Hooks (queries.ts)
  ↓
Transformation Utilities (transformers.ts)
  ↓
Host App Page (page.tsx)
  ↓
[For now: Dummy Data → Forge Component]
[Later: Real Data → Forge Component]
```

## Implementation Tasks

### 1. Extend Queries for All Collections

**File**: `app/lib/forge/queries.ts`

Add queries for missing collections:

- **Threads**:
  - `useThread(threadId)` - Get thread by ID
  - `useThreads(projectId?)` - List threads
  - Query with depth to include relationships

- **Flag Schemas**:
  - `useFlagSchema(schemaId)` - Get flag schema by ID
  - `useFlagSchemas(projectId?)` - List flag schemas
  - Extract `schema` JSON field as FlagSchema

- **Characters**:
  - `useCharacter(characterId)` - Get character by ID
  - `useCharacters(projectId?)` - List characters
  - Return as `Record<string, Character>`

- **Game States**:
  - `useGameState(stateId)` - Get game state by ID
  - `useGameStates(projectId?, threadId?, playerKey?)` - List game states with filters
  - Extract `state` JSON field as BaseGameState

- **Storylet Pools**:
  - `useStoryletPool(poolId)` - Get pool by ID
  - `useStoryletPoolsByChapter(chapterId)` - Get pools for a chapter
  - Include template relationships

- **Projects** (if needed):
  - `useProject(projectId)` - Get project by ID
  - `useProjects()` - List projects

### 2. Create Transformation Utilities

**File**: `app/lib/forge/transformers.ts` (new)

Create functions to transform PayloadCMS documents to forge component formats:

- **`transformThreadToStoryThread(payloadThread, payloadActs, payloadChapters, payloadPages, payloadStoryletTemplates, payloadStoryletPools)`**:
  - Build nested StoryThread structure
  - Map Payload IDs to forge IDs
  - Sort by `order` fields
  - Transform relationships to nested structure
  - Add `type` fields using NARRATIVE_ELEMENT constants

- **`transformDialogueDocumentToDialogueTree(dialogueDoc)`**:
  - Extract `tree` JSON field
  - Validate structure
  - Return DialogueTree

- **`transformFlagSchemaDocumentToFlagSchema(schemaDoc)`**:
  - Extract `schema` JSON field
  - Validate structure
  - Return FlagSchema

- **`transformCharactersToRecord(characters)`**:
  - Convert array to `Record<string, Character>`
  - Use character ID as key
  - Handle avatar relationships

- **`transformGameStateDocumentToBaseGameState(stateDoc)`**:
  - Extract `state` JSON field
  - Return BaseGameState

- **Helper functions**:
  - `buildNestedThreadStructure()` - Recursive building of thread hierarchy
  - `sortByOrder()` - Sort arrays by order field
  - `extractId()` - Handle both string IDs and relationship objects

### 3. Create Composite Query Hooks

**File**: `app/lib/forge/queries.ts` (extend)

Add composite hooks that fetch related data:

- **`useThreadWithAllData(threadId)`**:
  - Fetch thread
  - Fetch all acts for thread
  - Fetch all chapters for acts
  - Fetch all pages for chapters
  - Fetch all storylet templates for chapters
  - Fetch all storylet pools for chapters
  - Return combined data ready for transformation

- **`useWorkspaceData(threadId, dialogueId?, flagSchemaId?, gameStateId?)`**:
  - Fetch all data needed for NarrativeWorkspace
  - Return transformed data ready to use
  - Handle loading/error states

### 4. Create Type Definitions for Payload Documents

**File**: `app/lib/forge/types.ts` (new)

Define TypeScript interfaces for all PayloadCMS document types:

- `ThreadDocument`
- `ActDocument` (already exists, extend if needed)
- `ChapterDocument` (already exists, extend if needed)
- `PageDocument` (already exists, extend if needed)
- `StoryletTemplateDocument` (already exists, extend if needed)
- `StoryletPoolDocument`
- `FlagSchemaDocument`
- `CharacterDocument`
- `GameStateDocument`
- `ProjectDocument`

### 5. Update Host App Page

**File**: `app/(forge-app)/page.tsx`

- Import query hooks and transformers
- Add query for workspace data (or individual queries)
- Transform Payload data to forge formats
- Store transformed data in state/variables
- Keep passing dummy data to component for now
- Add console.log to verify data is being fetched and transformed
- Add loading/error UI (optional for now)

### 6. Handle Relationships and Depth

- Ensure all queries use appropriate `depth` parameter
- Handle both string IDs and populated relationship objects
- Create helper to extract IDs from relationships: `getRelationshipId(rel: string | { id: string })`

## File Structure

```
app/lib/forge/
├── payload-client.ts      # Already exists
├── queries.ts              # Extend with new queries
├── transformers.ts         # NEW - Transformation utilities
├── types.ts                # NEW - Payload document types
└── handlers/               # Already exists
```

## Key Implementation Details

### Thread Transformation Example

```typescript
export function transformThreadToStoryThread(
  thread: ThreadDocument,
  acts: ActDocument[],
  chapters: ChapterDocument[],
  pages: PageDocument[],
  storyletTemplates: StoryletTemplateDocument[],
  storyletPools: StoryletPoolDocument[]
): StoryThread {
  // Sort acts by order
  const sortedActs = acts
    .filter(act => getRelationshipId(act.thread) === thread.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(act => ({
      id: act.id,
      title: act.title,
      summary: act.summary,
      type: NARRATIVE_ELEMENT.ACT,
      chapters: buildChaptersForAct(act.id, chapters, pages, storyletTemplates, storyletPools),
    }))
  
  return {
    id: thread.id,
    title: thread.title,
    summary: thread.summary,
    type: NARRATIVE_ELEMENT.THREAD,
    acts: sortedActs,
  }
}
```

### Query Example

```typescript
export function useThreadWithAllData(threadId: string | null) {
  const threadQuery = useThread(threadId)
  const actsQuery = useActsByThread(threadId)
  // ... other queries
  
  return useMemo(() => {
    if (!threadQuery.data || !actsQuery.data) return null
    
    return {
      thread: threadQuery.data,
      acts: actsQuery.data,
      // ... other data
    }
  }, [threadQuery.data, actsQuery.data])
}
```

## Testing Strategy

- Test transformers with mock Payload documents
- Test queries with actual PayloadCMS (if seeded)
- Verify data structure matches forge component expectations
- Console.log transformed data to verify correctness

## Notes

- Keep dummy data in use for now - just prepare real data
- Focus on getting data structure correct before connecting to component
- Handle edge cases: missing relationships, null values, empty arrays
- Use constants (NARRATIVE_ELEMENT, etc.) instead of string literals
- Sort by `order` fields to maintain hierarchy order