# Zustand DevTools Guide

## Overview

Both stores (`ForgeUIStore` and `NarrativeWorkspaceStore`) are already configured with Zustand DevTools middleware. This allows you to inspect and debug state changes in real-time.

## Setup

### 1. Install Redux DevTools Extension

Zustand DevTools uses the Redux DevTools browser extension. Install it for your browser:

- **Chrome/Edge**: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- **Firefox**: [Redux DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### 2. Open DevTools

Once the extension is installed:

1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Look for the **"Redux"** tab in the DevTools panel
3. Click on it to see your Zustand stores

## Available Stores

You'll see two stores in the DevTools:

1. **ForgeUIStore** - UI state (view modes, tabs, modals, selection)
2. **NarrativeWorkspaceStore** - Domain state (dialogues, game state)

## Features

### Inspect State
- View the current state of any store
- See the full state tree with all slices

### Time Travel
- Click on any action in the history to see the state at that point
- Use the slider to scrub through state changes
- See what changed between actions

### Action History
- See all actions that modified state
- View the payload/parameters of each action
- See the state before and after each action

### Export/Import State
- Export the current state as JSON
- Import state to restore a previous state
- Useful for debugging specific scenarios

## Example Usage

1. **Debug a state change issue:**
   - Open DevTools → Redux tab
   - Perform the action that's causing issues
   - Look at the action history to see what changed
   - Inspect the state before/after to understand the issue

2. **Time travel debugging:**
   - Find the action that caused a bug
   - Click on the action before it in history
   - The app state will revert to that point
   - Step through actions one by one to find the issue

3. **Inspect current state:**
   - Open the Redux tab
   - Select a store (ForgeUIStore or NarrativeWorkspaceStore)
   - Browse the state tree to see all current values

## Store Names

- `ForgeUIStore` - UI state management
- `NarrativeWorkspaceStore` - Domain/workspace state management

## Troubleshooting

**Don't see the Redux tab?**
- Make sure the Redux DevTools extension is installed and enabled
- Refresh the page after installing the extension
- Check that you're in development mode (DevTools may be disabled in production builds)

**Stores not showing up?**
- Make sure the stores are being created (check that NarrativeWorkspace is rendered)
- The stores are only created when the component mounts

## Advanced: Custom DevTools Configuration

The stores are configured with default settings. If you need to customize, you can modify the `devtools` middleware options in:

- `src/components/forge/store/ui/createForgeUIStore.tsx`
- `src/components/NarrativeWorkspace/store/narrative-workspace-store.tsx`

Example customization:
```typescript
devtools(
  (set, get) => ({ /* store */ }),
  { 
    name: "ForgeUIStore",
    enabled: process.env.NODE_ENV === 'development', // Only in dev
    // ... other options
  }
)
```
