---
name: Fix Excessive API Requests
overview: Fix the subscription system to only trigger on actual project changes, add caching for flag schemas and game states, and implement request deduplication to prevent redundant API calls.
todos:
  - id: fix-subscription-selector
    content: Change subscription to use selector pattern - only trigger on selectedProjectId changes
    status: completed
  - id: add-cache-tracking
    content: Add loaded project ID tracking to gameState slice for flag schemas and game states
    status: completed
  - id: add-request-deduplication
    content: Add request deduplication to prevent simultaneous duplicate requests
    status: completed
  - id: add-cache-checks
    content: Add cache checks before fetching flag schemas, game states, and storylet graphs
    status: completed
    dependencies:
      - add-cache-tracking
---

# Fix Excessive API Requests

## Problem Analysis

The terminal logs show hundreds of repeated API requests for:

- `/api/forge-graphs?limit=200&where%5Bproject%5D%5Bequals%5D=1&where%5Bkind%5D%5Bequals%5D=STORYLET`
- `/api/flag-schemas?limit=1&where%5Bproject%5D%5Bequals%5D=1`
- `/api/game-states/1` (404s)

**Root Causes:**

1. **Subscription triggers on ALL state changes**: The `domainStore.subscribe()` in `subscriptions.ts` subscribes to the entire state, so every state change (including `focusedEditor`) triggers the callback, even though it returns early.

2. **No caching for flag schemas and game states**: These are fetched every time the subscription runs, even if they're already loaded.

3. **No request deduplication**: Multiple simultaneous requests for the same data aren't prevented.

4. **Subscription callback runs on every render**: Even with the `previousProjectId` check, the callback function is still being invoked.

## Solution Strategy

1. **Use selector-based subscription**: Subscribe only to `selectedProjectId` changes using Zustand's selector pattern
2. **Add caching layer**: Track loaded flag schemas and game states in the store
3. **Add request deduplication**: Prevent multiple simultaneous requests for the same resource
4. **Check cache before fetching**: Only fetch if data isn't already loaded

## Implementation

### 1. Fix Subscription to Use Selector Pattern

**File**: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`

- Replace `domainStore.subscribe((state) => {...})` with selector-based subscription
- Use `domainStore.subscribe((state) => state.selectedProjectId, (projectId) => {...})` pattern
- This ensures the callback only runs when `selectedProjectId` actually changes

### 2. Add Caching State for Flag Schemas and Game States

**File**: `src/components/ForgeWorkspace/store/slices/gameState.slice.ts`

- Add `loadedFlagSchemaProjectId: number | null` to track which project's flag schema is loaded
- Add `loadedGameStateProjectId: number | null` to track which project's game state is loaded
- Check these before fetching to avoid redundant requests

### 3. Add Request Deduplication

**File**: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`

- Track in-flight requests using a Map or Set
- Skip if a request for the same resource is already in progress
- Clear in-flight flag when request completes

### 4. Check Cache Before Fetching

**File**: `src/components/ForgeWorkspace/store/slices/subscriptions.ts`

- Before fetching flag schema: check if `loadedFlagSchemaProjectId === selectedProjectId` and schema exists
- Before fetching game state: check if `loadedGameStateProjectId === selectedProjectId` and state exists
- Before fetching storylet graphs: check if graphs are already in cache for this project

## Files to Modify

1. `src/components/ForgeWorkspace/store/slices/subscriptions.ts` - Fix subscription pattern and add caching checks
2. `src/components/ForgeWorkspace/store/slices/gameState.slice.ts` - Add loaded project ID tracking
3. `src/components/ForgeWorkspace/store/forge-workspace-store.tsx` - Export new state fields if needed

## Testing Considerations

- Verify subscription only triggers on project ID changes
- Verify no redundant API calls when state changes (like `focusedEditor`)
- Verify caching prevents re-fetching already loaded data
- Verify request deduplication prevents simultaneous duplicate requests
- Test edge cases: rapid project switching, component remounts