---
name: Fix PayloadCMS access control and game state error handling
overview: Fix the 403 permission error when fetching forge-graphs by adding public read access, and improve game state error handling to gracefully handle missing game states.
todos: []
---

# Fix PayloadCMS Access Control and Game State Error Handling

## Problem Analysis

Two issues identified:

1. **403 Permission Error**: The `forge-graphs` collection doesn't have access control defined, so PayloadCMS defaults to requiring authentication. When the app tries to fetch storylet graphs, it gets a 403 "You are not allowed to perform this action" error.

2. **Game State 404 Error**: The `getGameState` method throws an error when a game state doesn't exist (404), instead of gracefully handling it and returning a default empty state.

## Root Causes

1. **Missing Access Control**: [app/payload-collections/collection-configs/forge-graphs.ts](app/payload-collections/collection-configs/forge-graphs.ts) doesn't have an `access` property, unlike other collections like `Projects` which has `access: { read: () => true }`.

2. **Unhandled 404**: [app/lib/forge/data-adapter/payload-forge-adapter.ts](app/lib/forge/data-adapter/payload-forge-adapter.ts) `getGameState` method calls `payload.findByID` which throws when the document doesn't exist, instead of catching the error and returning a default.

## Solution

### Step 1: Add Access Control to ForgeGraphs Collection

- Add `access` property to `ForgeGraphs` collection config
- Allow public read access (same as Projects collection)
- Allow create/update/delete for development (can be restricted later if needed)

**File**: [app/payload-collections/collection-configs/forge-graphs.ts](app/payload-collections/collection-configs/forge-graphs.ts)

### Step 2: Improve Game State Error Handling

- Wrap `payload.findByID` in try-catch
- Return default empty game state `{ flags: {} }` when game state doesn't exist (404)
- Log the error for debugging but don't throw

**File**: [app/lib/forge/data-adapter/payload-forge-adapter.ts](app/lib/forge/data-adapter/payload-forge-adapter.ts)

## Implementation Details

### ForgeGraphs Access Control

```typescript
access: {
  read: () => true,  // Public read access
  create: () => true,  // Allow creation (can restrict later)
  update: () => true,  // Allow updates (can restrict later)
  delete: () => true,  // Allow deletion (can restrict later)
},
```

### Game State Error Handling

```typescript
async getGameState(projectId: number): Promise<ForgeGameState> {
  try {
    const result = await payload.findByID({
      collection: PAYLOAD_COLLECTIONS.GAME_STATES,
      id: projectId,
    }) as GameState;
    // ... rest of the method
  } catch (error: any) {
    // Handle 404 or other errors gracefully
    if (error?.status === 404 || error?.message?.includes('not found')) {
      // Return default empty game state
      return { flags: {} };
    }
    // Re-throw unexpected errors
    throw error;
  }
}
```

## Files to Modify

1. [app/payload-collections/collection-configs/forge-graphs.ts](app/payload-collections/collection-configs/forge-graphs.ts) - Add access control
2. [app/lib/forge/data-adapter/payload-forge-adapter.ts](app/lib/forge/data-adapter/payload-forge-adapter.ts) - Add error handling to getGameState