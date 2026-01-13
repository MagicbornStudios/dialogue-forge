---
name: Fix getServerSnapshot infinite loop and initialize project
overview: Fix the Zustand store's getServerSnapshot infinite loop issue by implementing proper caching, and ensure the app can load the initial project and its graphs correctly.
todos: []
---

# Fix getServerSnapshot Infinite Loop and Initialize Project

## Problem Analysis

The infinite loop occurs because:

1. **React 19 Requirement**: React 19's `useSyncExternalStore` (used by Zustand's `useStore`) requires `getServerSnapshot` to return a stable value
2. **Unstable Return Values**: The current `getServerSnapshot` implementation calls `selectorRef.current(store.getState())` which can return new object/array references on each call, even when data hasn't changed
3. **Selector Patterns**: Selectors like `s => Object.values(s.graphs.byId).filter(...)` create new arrays each time, causing React to detect "changes" and re-render infinitely

## Root Cause

The issue is in `useForgeWorkspaceStore` at [src/components/ForgeWorkspace/store/forge-workspace-store.tsx](src/components/ForgeWorkspace/store/forge-workspace-store.tsx:248-269):

- `getServerSnapshot` is memoized but the function it returns calls `selectorRef.current(store.getState())` which may return new references
- React compares the return value of `getServerSnapshot()` and if it changes, triggers re-renders
- Since selectors can return new arrays/objects, this creates an infinite loop

## Solution Strategy

Since this is a **client-only component** (`'use client'`), we have two options:

1. **Remove `getServerSnapshot` entirely** - Let Zustand handle it internally (simplest)
2. **Implement proper caching** - Cache snapshots per selector with stable references

Given that `useForgeEditorSession` doesn't use `getServerSnapshot` and works fine, we'll **remove it** and let Zustand handle SSR internally.

## Implementation Plan

### Step 1: Fix `useForgeWorkspaceStore` Hook

- Remove the `getServerSnapshot` implementation
- Use the same pattern as `useForgeEditorSession`: just `useStore(store, selector)`
- This works because Zustand 5.x handles SSR internally when no `getServerSnapshot` is provided

**File**: [src/components/ForgeWorkspace/store/forge-workspace-store.tsx](src/components/ForgeWorkspace/store/forge-workspace-store.tsx)

### Step 2: Verify Project Initialization Flow

- Check that `ProjectSync` correctly updates the store when `selectedProjectId` changes
- Verify that `setupForgeWorkspaceSubscriptions` properly loads graphs when a project is selected
- Ensure the subscription in [src/components/ForgeWorkspace/store/slices/subscriptions.ts](src/components/ForgeWorkspace/store/slices/subscriptions.ts) correctly handles project changes

### Step 3: Test the Fix

- Verify no infinite loop errors
- Test that selecting a project loads its graphs
- Ensure the StoryletsSidebar displays correctly

## Architecture Notes

The store architecture follows this pattern:

- **Vanilla Zustand store** created with `createStore` (not React hook)
- **Context provider** wraps the store for React access
- **Custom hook** (`useForgeWorkspaceStore`) provides typed access
- **Subscriptions** handle side effects (loading graphs when project changes)

This pattern is consistent with `useForgeEditorSession` which works correctly without `getServerSnapshot`.

## Files to Modify

1. [src/components/ForgeWorkspace/store/forge-workspace-store.tsx](src/components/ForgeWorkspace/store/forge-workspace-store.tsx) - Remove `getServerSnapshot` implementation