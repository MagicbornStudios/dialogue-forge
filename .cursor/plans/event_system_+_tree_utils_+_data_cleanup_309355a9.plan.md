---
name: Event System + Tree Utils + Data Cleanup
overview: Complete event handling tests, establish event handler pattern for Next.js/PayloadCMS host, add d3-hierarchy tree navigation utilities, and clean up PayloadCMS collections by removing duplicate ID fields and fixing seed data flow.
todos:
  - id: event-tests
    content: Complete event creation tests in events.test.ts for all event types
    status: completed
  - id: event-handler-registry
    content: Create EventHandlerRegistry class in handlers.ts with type-safe registration/dispatching
    status: pending
  - id: host-event-pattern
    content: Create host app event handler pattern in app/lib/forge-event-handlers.ts
    status: completed
    dependencies:
      - event-handler-registry
  - id: handler-tests
    content: Test event handler system in handlers.test.ts
    status: pending
    dependencies:
      - event-handler-registry
  - id: install-d3
    content: Install d3-hierarchy package and types
    status: completed
  - id: tree-navigation-utils
    content: Create tree navigation utilities using d3-hierarchy in tree-navigation.ts
    status: completed
    dependencies:
      - install-d3
  - id: tree-editing-utils
    content: Create tree editing utilities with immutable updates in tree-editing.ts
    status: pending
    dependencies:
      - install-d3
  - id: tree-tests
    content: Test tree navigation and editing utilities
    status: pending
    dependencies:
      - tree-navigation-utils
      - tree-editing-utils
  - id: remove-duplicate-ids
    content: Remove duplicate ID fields (actId, chapterId, etc.) from all collection configs
    status: pending
  - id: fix-seed-data
    content: "Refactor seed data to: seed base → fetch IDs → seed dependents with Payload IDs"
    status: pending
    dependencies:
      - remove-duplicate-ids
  - id: verify-reactflow
    content: Verify React Flow conversion still works with cleaned data
    status: pending
    dependencies:
      - remove-duplicate-ids
---

# Event System + Tree Navigation + Data Cleanup

## Overview

This plan addresses three main areas:

1. **Event System**: Complete tests and establish stable event handler pattern for Next.js/PayloadCMS host
2. **Tree Navigation**: Add d3-hierarchy utilities for querying/navigating dialogue trees (read-only for testing)
3. **Data Cleanup**: Remove duplicate ID fields from PayloadCMS collections and fix seed data flow

## Architecture Decisions

### Event Handler Pattern

- Create `src/components/forge/events/handlers.ts` with typed event handler registry
- Host app registers handlers via `registerEventHandler(type, handler)` pattern
- Events are dispatched from `NarrativeWorkspace` via `onEvent` prop
- Handlers are tested via unit tests that verify event routing

### Tree Navigation Strategy

- **d3-hierarchy**: Read-only queries for testing (find nodes, paths, ancestors, descendants)
- **React Flow**: UI editing (mutations happen in React Flow/Zustand)
- **Workflow**: Edit in Zustand → Convert to DialogueTree → Verify with d3-hierarchy in tests
- Create `src/utils/tree-navigation.ts` with query utilities
- Create `src/utils/tree-editing.ts` with editing utilities (immutable updates)

### Data Model

- **Single ID field**: Only Payload `id` field (remove actId, chapterId, pageId, dialogueId, threadId, templateId, poolId, schemaId, characterKey)
- **Relationships**: Use Payload relationship fields (already configured)
- **Seed Flow**: Seed base entities → Fetch created IDs → Seed dependent entities with those IDs

## Implementation Tasks

### 1. Event System Tests & Handler Pattern (Blocking)

**1.1 Complete Event Creation Tests**

- File: `src/components/forge/events/events.test.ts`
- Add tests for:
  - All event types (ui.tabChanged, narrative.select, dialogue.openRequested, dialogue.changed, storyletTemplate.openRequested)
  - Event ID uniqueness
  - Timestamp ordering
  - Payload type safety

**1.2 Create Event Handler Registry**

- File: `src/components/forge/events/handlers.ts` (new)
- Create `EventHandlerRegistry` class with:
  - `register(type, handler)` - Register typed handler
  - `dispatch(event)` - Route event to registered handler
  - `unregister(type)` - Remove handler
  - Type-safe handler signatures per event type

**1.3 Create Host App Event Handler Pattern**

- File: `app/lib/forge-event-handlers.ts` (new)
- Example pattern:
  ```typescript
  const handlers = createForgeEventHandlers({
    'ui.tabChanged': (event) => { /* handle */ },
    'dialogue.changed': (event) => { /* handle */ },
    // ... all event types
  });
  ```

- Export `useForgeEventHandlers()` hook for React components

**1.4 Test Event Handler System**

- File: `src/components/forge/events/handlers.test.ts` (new)
- Test handler registration/dispatching
- Test event routing
- Test handler error handling

### 2. Tree Navigation Utilities (Blocking)

**2.1 Install d3-hierarchy**

- Add `d3-hierarchy` to `package.json` dependencies
- Add type definitions if needed

**2.2 Create Tree Navigation Utilities**

- File: `src/utils/tree-navigation.ts` (new)
- Functions:
  - `createTreeHierarchy(dialogue: DialogueTree)` - Convert to d3.hierarchy
  - `findNode(hierarchy, nodeId)` - Find node by ID
  - `findPath(hierarchy, fromId, toId)` - Get path between nodes
  - `getAncestors(hierarchy, nodeId)` - Get all ancestors
  - `getDescendants(hierarchy, nodeId)` - Get all descendants
  - `getNodeDepth(hierarchy, nodeId)` - Get depth in tree
  - `getNodeHeight(hierarchy, nodeId)` - Get height from node
  - `validateTreeStructure(dialogue)` - Validate tree integrity
  - `getAllNodes(hierarchy)` - Flatten to array
  - `countNodes(hierarchy)` - Count total nodes

**2.3 Create Tree Editing Utilities**

- File: `src/utils/tree-editing.ts` (new)
- Functions (immutable updates):
  - `addNode(dialogue, parentId, newNode)` - Add node to tree
  - `removeNode(dialogue, nodeId)` - Remove node and update connections
  - `updateNode(dialogue, nodeId, updates)` - Update node properties
  - `moveNode(dialogue, nodeId, newParentId)` - Move node in tree
  - `replaceNode(dialogue, nodeId, newNode)` - Replace node
  - `reconnectNode(dialogue, nodeId, newConnections)` - Update node connections

**2.4 Test Tree Navigation & Editing**

- File: `src/utils/tree-navigation.test.ts` (new)
- File: `src/utils/tree-editing.test.ts` (new)
- Test all navigation functions with d3-hierarchy
- Test editing functions (edit → verify with d3)
- Test edge cases (orphaned nodes, cycles, invalid IDs)

### 3. Collection Config Cleanup (Easiest First)

**3.1 Remove Duplicate ID Fields**

- Files to update:
  - `app/payload-collections/collection-configs/acts.ts` - Remove `actId` field and validation hook
  - `app/payload-collections/collection-configs/chapters.ts` - Remove `chapterId` field and validation hook
  - `app/payload-collections/collection-configs/pages.ts` - Remove `pageId` field and validation hook, keep `dialogueId` (denormalized for fast access)
  - `app/payload-collections/collection-configs/dialogues.ts` - Remove `dialogueId` field and validation hook
  - `app/payload-collections/collection-configs/threads.ts` - Remove `threadId` field and validation hook
  - `app/payload-collections/collection-configs/storylet-templates.ts` - Remove `templateId` field and validation hook
  - `app/payload-collections/collection-configs/storylet-pools.ts` - Remove `poolId` field and validation hook
  - `app/payload-collections/collection-configs/flag-schemas.ts` - Remove `schemaId` field and validation hook, update `useAsTitle` to use `id`
  - `app/payload-collections/collection-configs/characters.ts` - Remove `characterKey` field (if exists)

**3.2 Update Seed Data Flow**

- File: `app/payload-seed.ts`
- Refactor to:

  1. Seed base entities (projects, characters, flag-schemas, dialogues) without IDs
  2. Fetch created entities to get Payload `id` values
  3. Seed dependent entities (threads, acts, chapters, pages, storylet-templates, storylet-pools) using fetched IDs

- Remove all references to `actId`, `chapterId`, `pageId`, `dialogueId`, `threadId`, `templateId`, `poolId`, `schemaId`, `characterKey`
- Use Payload `id` values for relationships

**3.3 Verify Constants Remain**

- Ensure all collection configs still have constants (PAYLOAD_COLLECTIONS enum)
- Verify no build errors

### 4. React Flow Compatibility Verification

**4.1 Test Dialogue Tree Conversion**

- Verify `src/utils/reactflow-converter.ts` still works with cleaned data
- Ensure node IDs are preserved (they come from DialogueTree, not Payload)
- Test conversion in both directions (DialogueTree ↔ React Flow)

**4.2 Integration Test**

- Run demo app and verify:
  - Dialogue trees load correctly
  - React Flow editor works
  - Node connections work
  - Tree navigation works

## File Changes Summary

### New Files

- `src/components/forge/events/handlers.ts` - Event handler registry
- `src/components/forge/events/handlers.test.ts` - Handler tests
- `app/lib/forge-event-handlers.ts` - Host app event handler pattern
- `src/utils/tree-navigation.ts` - d3-hierarchy navigation utilities
- `src/utils/tree-editing.ts` - Tree editing utilities
- `src/utils/tree-navigation.test.ts` - Navigation tests
- `src/utils/tree-editing.test.ts` - Editing tests

### Modified Files

- `src/components/forge/events/events.test.ts` - Complete event tests
- `app/payload-collections/collection-configs/acts.ts` - Remove actId
- `app/payload-collections/collection-configs/chapters.ts` - Remove chapterId
- `app/payload-collections/collection-configs/pages.ts` - Remove pageId, keep dialogueId (denormalized)
- `app/payload-collections/collection-configs/dialogues.ts` - Remove dialogueId
- `app/payload-collections/collection-configs/threads.ts` - Remove threadId
- `app/payload-collections/collection-configs/storylet-templates.ts` - Remove templateId
- `app/payload-collections/collection-configs/storylet-pools.ts` - Remove poolId
- `app/payload-collections/collection-configs/flag-schemas.ts` - Remove schemaId
- `app/payload-collections/collection-configs/characters.ts` - Remove characterKey (if exists)
- `app/payload-seed.ts` - Refactor seed flow to use Payload IDs
- `package.json` - Add d3-hierarchy dependency

## Testing Strategy

1. **Unit Tests**: All new utilities and event handlers
2. **Integration Tests**: Event handler registration in host app
3. **Tree Tests**: Navigation and editing with d3-hierarchy verification
4. **Seed Tests**: Verify seed data creates correct relationships
5. **Build Test**: Ensure no TypeScript/build errors

## Notes

- **d3-hierarchy is read-only**: All mutations happen in Zustand/React Flow, d3 is only for querying/verification
- **Single ID field**: Payload `id` is the source of truth, relationships use Payload relationship fields
- **Seed flow**: Must fetch IDs after creation before seeding dependents
- **Constants preserved**: All PAYLOAD_COLLECTIONS constants remain in configs
- **React Flow compatibility**: DialogueTree structure unchanged, only Payload collection fields changed