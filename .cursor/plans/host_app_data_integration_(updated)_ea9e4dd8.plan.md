---
name: Host App Data Integration (Updated)
overview: Generate PayloadCMS types from collections, create queries for all collections, build transformation utilities to prepare PayloadCMS data for forge component, and update host app to fetch and prepare data. The forge component will be updated later to match PayloadCMS structure (one-to-one).
todos:
  - id: generate-payload-types
    content: Run npm run payload:generate to generate PayloadCMS types from collections
    status: completed
  - id: extend-queries
    content: Extend queries.ts with hooks for threads, flag schemas, characters, game states, storylet pools, and projects using generated PayloadCMS types
    status: completed
    dependencies:
      - generate-payload-types
  - id: create-transformers
    content: Create app/lib/forge/transformers.ts with data preparation functions that prepare PayloadCMS data for forge component
    status: completed
    dependencies:
      - extend-queries
  - id: composite-queries
    content: Add composite query hooks (useThreadWithAllData, useWorkspaceData) that fetch related data together
    status: completed
    dependencies:
      - extend-queries
  - id: update-page
    content: Update app/(forge-app)/page.tsx to query and prepare PayloadCMS data, keeping dummy data for component but having real data ready
    status: completed
    dependencies:
      - create-transformers
      - composite-queries
---

# Host App Data Integration (Updated)

## Overview

Generate PayloadCMS types from collections, create queries for all collections, build transformation utilities to prepare PayloadCMS data for the forge component, and update the host app to fetch and prepare data. The forge component will be updated later to match PayloadCMS structure (one-to-one mapping). Game state includes character IDs, but characters are populated from the project when building workspace data.

## Data Flow

```
PayloadCMS Collections
  ↓
Generate Types (payload generate:types)
  ↓
React Query Hooks (queries.ts)
  ↓
Transformation Utilities (transformers.ts)
  ↓
Host App Page (page.tsx)
  ↓
[For now: Dummy Data → Forge Component]
[Later: Real Data → Forge Component (forge types updated to match PayloadCMS)]
```

## Architecture Decision

**PayloadCMS is the source of truth** - The forge component will be updated to accept PayloadCMS data structures directly. Transformation utilities prepare the data in the correct shape, but the types will align with PayloadCMS collections.

## Implementation Tasks

### 1. Generate PayloadCMS Types

**Command**: Run `npm run payload:generate`

This generates types in `app/payload-types.ts` based on collection configs.

**File**: `app/payload-types.ts` (generated, don't edit manually)

- Contains TypeScript interfaces for all collections
- Includes relationship types (string IDs or populated objects)
- Includes all field types

### 2. Extend Queries for All Collections

**File**: `app/lib/forge/queries.ts`

Add queries for missing collections using generated PayloadCMS types:

- **Threads**:
  - `useThread(threadId)` - Get thread by ID with depth
  - `useThreads(projectId?)` - List threads for project
  - Import type from `app/payload-types.ts`

- **Flag Schemas**:
  - `useFlagSchema(schemaId)` - Get flag schema by ID
  - `useFlagSchemas(projectId?)` - List flag schemas
  - Extract `schema` JSON field

- **Characters**:
  - `useCharacter(characterId)` - Get character by ID
  - `useCharacters(projectId?)` - List characters for project
  - Return as array (will be transformed to Record later)

- **Game States**:
  - `useGameState(stateId)` - Get game state by ID
  - `useGameStates(projectId?, threadId?, playerKey?)` - List with filters
  - Extract `state` JSON field
  - For workspace: fetch authored game state for thread

- **Storylet Pools**:
  - `useStoryletPool(poolId)` - Get pool by ID
  - `useStoryletPoolsByChapter(chapterId)` - Get pools for chapter
  - Include template relationships with depth

- **Projects**:
  - `useProject(projectId)` - Get project by ID
  - `useProjects()` - List all projects

### 3. Create Transformation Utilities

**File**: `app/lib/forge/transformers.ts` (new)

Create functions to prepare PayloadCMS data for forge component. These prepare the data structure, but types will match PayloadCMS:

- **`prepareThreadData(thread, acts, chapters, pages, storyletTemplates, storyletPools)`**:
  - Build nested structure from flat PayloadCMS relationships
  - Sort by `order` fields
  - Handle relationship objects (extract IDs)
  - Return structure matching PayloadCMS types (forge will be updated to accept this)

- **`prepareDialogueData(dialogueDoc)`**:
  - Extract `tree` JSON field
  - Return DialogueTree (will match PayloadCMS structure)

- **`prepareFlagSchemaData(schemaDoc)`**:
  - Extract `schema` JSON field
  - Return FlagSchema (will match PayloadCMS structure)

- **`prepareCharactersData(characters, gameState)`**:
  - Get character IDs from game state `state` JSON
  - Fetch characters from project
  - Build `Record<string, Character>` from character documents
  - Handle avatar relationships

- **`prepareGameStateData(gameStateDoc, characters)`**:
  - Extract `state` JSON field
  - Populate characters from project characters collection
  - Return BaseGameState with characters included

- **Helper functions**:
  - `getRelationshipId(rel: string | { id: string })` - Extract ID from relationship
  - `sortByOrder(items)` - Sort by order field
  - `buildNestedStructure()` - Build hierarchy from flat relationships

### 4. Create Composite Query Hooks

**File**: `app/lib/forge/queries.ts` (extend)

Add composite hooks that fetch all related data:

- **`useThreadWithAllData(threadId)`**:
  - Fetch thread
  - Fetch all acts for thread (where thread relationship matches)
  - Fetch all chapters for acts
  - Fetch all pages for chapters
  - Fetch all storylet templates for chapters
  - Fetch all storylet pools for chapters
  - Return combined data ready for transformation

- **`useWorkspaceData(threadId, dialogueId?, flagSchemaId?, gameStateId?)`**:
  - Fetch thread with all nested data
  - Fetch dialogue
  - Fetch flag schema
  - Fetch game state (authored type for thread)
  - Fetch characters for project (from game state or project)
  - Return all data ready for forge component
  - Handle loading/error states

### 5. Update Host App Page

**File**: `app/(forge-app)/page.tsx`

- Import generated PayloadCMS types from `app/payload-types.ts`
- Import query hooks and transformers
- Use `useWorkspaceData()` or individual queries
- Transform/prepare PayloadCMS data using transformers
- Store prepared data in state/variables
- **Keep passing dummy data to component for now**
- Add console.log to verify data is being fetched and prepared
- Add loading/error UI (optional for now)

### 6. Type Imports and Usage

- Import PayloadCMS types: `import type { Thread, Act, Chapter, Page, ... } from '@/app/payload-types'`
- Use generated types in queries instead of manually defined interfaces
- Transformation functions accept PayloadCMS types and return prepared data
- Types will be one-to-one with PayloadCMS structure

## File Structure

```
app/
├── payload-types.ts        # Generated by PayloadCMS (don't edit)
├── lib/forge/
│   ├── payload-client.ts   # Already exists
│   ├── queries.ts          # Extend with new queries using payload-types
│   ├── transformers.ts    # NEW - Data preparation utilities
│   └── handlers/           # Already exists
└── (forge-app)/
    └── page.tsx            # Update to query and prepare data
```

## Key Implementation Details

### Using Generated Types

```typescript
import type { Thread, Act, Chapter, Page, Dialogue, FlagSchema, Character, GameState } from '@/app/payload-types'

export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: ['threads', threadId],
    queryFn: async () => {
      const client = getPayloadClient()
      return client.findByID<Thread>(PAYLOAD_COLLECTIONS.THREADS, threadId, { depth: 1 })
    },
    enabled: !!threadId,
  })
}
```

### Game State with Characters

```typescript
export function prepareGameStateData(
  gameState: GameState,
  projectCharacters: Character[]
): BaseGameState {
  const state = gameState.state as { flags?: Record<string, unknown>; characterIds?: string[] }
  
  // Get character IDs from game state
  const characterIds = state.characterIds || []
  
  // Build characters record from project characters
  const characters: Record<string, Character> = {}
  characterIds.forEach(id => {
    const char = projectCharacters.find(c => c.id === id)
    if (char) {
      characters[id] = transformCharacterDocument(char)
    }
  })
  
  return {
    flags: state.flags || {},
    characters, // Characters populated from project
  }
}
```

### Thread Data Preparation

```typescript
export function prepareThreadData(
  thread: Thread,
  acts: Act[],
  chapters: Chapter[],
  pages: Page[],
  storyletTemplates: StoryletTemplate[],
  storyletPools: StoryletPool[]
): PreparedThreadData {
  // Filter and sort acts for this thread
  const threadActs = acts
    .filter(act => getRelationshipId(act.thread) === thread.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(act => ({
      ...act, // Use PayloadCMS structure
      chapters: buildChaptersForAct(act.id, chapters, pages, storyletTemplates, storyletPools),
    }))
  
  return {
    ...thread,
    acts: threadActs,
  }
}
```

## Testing Strategy

- Run `npm run payload:generate` to ensure types are up to date
- Test queries with actual PayloadCMS data
- Verify prepared data structure matches what forge will expect
- Console.log prepared data to verify correctness
- Test with seeded data from `payload-seed.ts`

## Notes

- **PayloadCMS types are generated** - Don't manually define document types
- **Forge will be updated later** to accept PayloadCMS structure directly
- **Game state includes character IDs**, but characters are populated from project
- **Transformation utilities prepare data** but maintain PayloadCMS structure
- **One-to-one mapping** - PayloadCMS structure is source of truth
- Keep dummy data in use for now - just prepare real data
- Use constants (NARRATIVE_ELEMENT, etc.) instead of string literals
- Sort by `order` fields to maintain hierarchy order