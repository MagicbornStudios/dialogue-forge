# Workspace Editor Architecture Guide

## Overview

This guide describes the workspace architecture used across Dialogue Forge. It focuses on clean boundaries, predictable state flow, and editor-library integration. It is the canonical reference for all workspace implementations.

**Hard rules in this architecture:**
- No draft slices.
- No event bus / EventSink layer.

**Path note:** examples reference `packages/<domain>/src` (domains are now extracted).

## Architecture Layers

The workspace architecture has four layers:

1. **Host Application Layer**: Implements adapters and routes (Next.js / Payload).
2. **Workspace Layer**: Owns domain state, UI state, and adapters.
3. **Editor Session Layer**: Per-instance UI state for an editor instance.
4. **Editor Library Layer**: Third-party editors (React Flow, Lexical, JointJS, Twick).

## Platform Host Mindset

- The host app is the platform: it owns routing, auth, and external systems.
- Workspaces should remain portable and only talk to the host via contracts/adapters.
- If auth/entitlements are required, the host gates access before mounting workspaces.

### State Ownership

- **Persistent Domain State (Workspace Store)**: graphs, documents, templates, modal state.
- **Ephemeral UI State (Editor Session Store)**: selection, per-editor toggles, UI preferences.
- **Library State**: internal state managed by the editor library itself.

## Core Concepts

### 1. Workspace Store (Domain State)

**Purpose**: Owns persistent domain state and exposes actions to mutate it.

**Location**: `packages/<domain>/src/components/{Domain}Workspace/store/{domain}-workspace-store.tsx`

**Characteristics**:
- Zustand + Immer (or equivalent).
- Slice-based, with clear ownership per slice.
- No draft/commit workflow.
- No event bus.
- All mutations go through explicit actions.

### 1.5 Workspace Contracts (Host <-> Workspace Boundary)

**Purpose**: Define stable, typed interfaces between a workspace and the host app.

**Location**: `packages/<domain>/src/workspace/{domain}-workspace-contracts.ts`

**Rules**:
- Pure types/interfaces only.
- Must not import host app types.
- Host implements adapters; workspace consumes the contract.

### 2. Editor Session Store (Per-Instance UI State)

**Purpose**: Holds ephemeral, editor-specific UI state.

**Location**: `packages/<domain>/src/components/{Domain}Workspace/components/{Editor}/hooks/use{Editor}Session.tsx`

**Use it for**:
- Selected node/layer.
- Editor UI toggles (minimap, overlays).
- Local session preferences.

**Do not use it for**:
- Domain data.
- Modal state.
- Data that must persist across editor mounts.

### 3. Editor Shell (Bridge Pattern)

**Purpose**: Bridges editor library events to workspace actions.

**Location**: `packages/<domain>/src/components/{Domain}Workspace/components/{Editor}/hooks/use{Editor}Shell.ts`

**Responsibilities**:
- Translate editor library events into domain actions.
- Provide command dispatch and selection wiring.
- Keep editor library state and domain state in sync.

### 4. Command Pattern

**Purpose**: Keep editor actions typed, testable, and consistent.

**Location**:
- Commands: `packages/<domain>/src/components/{Domain}Workspace/components/{Editor}/hooks/{domain}-commands.ts`
- Actions: `packages/<domain>/src/components/{Domain}Workspace/components/{Editor}/hooks/use{Editor}Actions.tsx`

### 5. Subscriptions (No Event Bus)

**Purpose**: React to workspace state changes without an event system.

**Pattern**:
- Use `store.subscribe(selector, callback)` inside `useEffect`.
- Always return the unsubscribe function on unmount.
- Keep subscriptions narrowly scoped to avoid re-render churn.

**Rule**: Do not introduce an EventSink or event bus layer.

### 6. Modal Management

**Pattern**: Modal state lives in the workspace store (viewState slice).

**Example**:
- `viewState.slice.ts` stores modal open/close state.
- A single modal switcher component renders all modals.

### 7. Auto-Save Coordination (No Drafts)

**Purpose**: Provide consistent saving behavior without draft/commit layers.

**Pattern**:
- Debounced saves for incremental changes.
- Immediate saves for structural changes.
- Keep save indicators in workspace UI (isSaving, lastSavedAt).

## Slice Organization

**Slice principles**:
- Each slice owns one concern.
- Slices must not import each other.
- Keep cross-slice coordination in the store file.
- Avoid introducing draft slices.

**Recommended slices**:

**Forge**:
- `graph.slice.ts`
- `gameState.slice.ts`
- `viewState.slice.ts`
- `project.slice.ts`

**Writer**:
- `content.slice.ts`
- `editor.slice.ts`
- `ai.slice.ts`
- `navigation.slice.ts`
- `viewState.slice.ts`

**Video (Twick)**:
- `template.slice.ts` (lightweight, optional)
- `viewState.slice.ts`
- `project.slice.ts`

**Characters**:
- `graph.slice.ts`
- `viewState.slice.ts`
- `project.slice.ts`

## Communication Flow (No Events)

1. User interaction triggers a component.
2. Component calls editor actions (command pattern).
3. Editor shell translates library events to actions.
4. Workspace store updates state.
5. Components re-render based on state changes.
6. Subscriptions (if any) run side-effects via `store.subscribe`.

## Anti-Patterns

**Do not do these**:
- Draft/commit slices.
- Event bus/EventSink layers.
- Domain data in session stores.
- Modal state in local component state.
- Cross-slice imports.
- Editor shell for simple forms.

## Decision Tree

```
Is this domain data that persists?
  YES -> Workspace Store (appropriate slice)
  NO -> Is this UI state for a specific editor instance?
    YES -> Editor Session Store
    NO -> Is this modal state?
      YES -> Workspace Store viewState slice
      NO -> Is this a simple form/input?
        YES -> Direct component with workspace actions
        NO -> Does the editor library emit complex events?
          YES -> Editor Shell + Command Pattern
          NO -> Direct component
```

## File Structure Reference

```
packages/<domain>/src/
  components/
    {Domain}Workspace/
      {Domain}Workspace.tsx
      store/
        {domain}-workspace-store.tsx
        {domain}-workspace-types.ts
        slices/
          content.slice.ts
          editor.slice.ts
          viewState.slice.ts
          project.slice.ts
      components/
        {Editor}/
          {Editor}.tsx
          hooks/
            use{Editor}Session.tsx
            use{Editor}Shell.ts
            {domain}-commands.ts
            use{Editor}Actions.tsx
      modals/
        {Domain}WorkspaceModals.tsx
        components/
          {Modal}Modal.tsx
  workspace/
    {domain}-workspace-contracts.ts
```

## Domain Notes

**Forge (React Flow)**:
- Use the editor shell for React Flow events.
- Keep auto-save logic in one place (no draft layers).

**Writer (Lexical)**:
- Favor direct saves and explicit actions.
- Keep editor state in Lexical; store only what needs persistence.

**Video (Twick Studio)**:
- Twick Studio is the editor surface.
- Workspace wrapper stays thin (providers + contextId).
- Persistence should be adapter-driven; no custom timeline engine.

**Characters (JointJS)**:
- Use a dedicated facade to bridge JointJS to domain state.
- Keep serialization logic in one place.

## Summary

- Workspace store owns domain state; no draft slices.
- Editor session store owns per-editor UI state.
- Editor shell bridges editor libraries to domain actions.
- Command pattern keeps actions typed and testable.
- Subscriptions are direct store.subscribe, not events.


