---
name: Paradigm Audit & Cleanup - Type System Consolidation
overview: Comprehensive audit and cleanup to align codebase with flow-first paradigm. Consolidate node type constants (remove NODE_TYPE, use FORGE_NODE_TYPE), eliminate NARRATIVE_ELEMENT redundancy, remove references to deleted types (NarrativeSelection, StoryThread, pools), fix PlayModal, and update documentation. This will be iterative over multiple PRs.
todos:
  - id: phase1-remove-narrative-element
    content: Remove NARRATIVE_ELEMENT constant from narrative.ts and replace all usages with FORGE_NODE_TYPE or NARRATIVE_FORGE_NODE_TYPE
    status: pending
  - id: phase2-migrate-node-type
    content: Migrate all NODE_TYPE usages to FORGE_NODE_TYPE in yarn-converter, yarn-runner, and ui-constants
    status: pending
  - id: phase3-remove-deleted-types
    content: Remove references to NarrativeSelection, StoryThread, and pool-related types from UI store and components
    status: pending
  - id: phase4-fix-playmodal
    content: Simplify PlayModal to only take ForgeGraphDoc, remove StoryThread prop
    status: pending
    dependencies:
      - phase3-remove-deleted-types
  - id: phase5-update-docs
    content: Update agents.md and README.md with consolidated type system documentation
    status: pending
    dependencies:
      - phase1-remove-narrative-element
      - phase2-migrate-node-type
---

# Paradigm Audit & Cleanup - Type System Consolidation

## Current State Analysis

### Type System Issues

1. **Duplicate Node Type Constants**

   - `NODE_TYPE` in `src/types/constants.ts` (old, lowercase: 'npc', 'player', etc.)
   - `FORGE_NODE_TYPE` in `src/types/forge/forge-graph.ts` (new, uppercase: 'CHARACTER', 'PLAYER', etc.)
   - `NARRATIVE_ELEMENT` in `src/types/narrative.ts` (redundant, duplicates FORGE_NODE_TYPE values)
   - **Paradigm**: Use `FORGE_NODE_TYPE` everywhere. `NARRATIVE_FORGE_NODE_TYPE` is a subset constant for narrative-specific types.

2. **Removed Types Still Referenced**

   - `NarrativeSelection` - referenced in UI store but doesn't exist
   - `StoryThread` - referenced in PlayModal but doesn't exist
   - `StoryletPool`, `StoryletTemplate`, `StoryletPoolMember`, `STORYLET_SELECTION_MODE` - all removed but still imported

3. **Legacy Code Using Old Patterns**

   - `src/lib/yarn-converter.ts` - uses old `NODE_TYPE`
   - `src/lib/yarn-runner/node-processor.ts` - uses old `NODE_TYPE`
   - `src/types/ui-constants.ts` - imports old `NODE_TYPE` and `NARRATIVE_ELEMENT`
   - `src/components/forge/store/ui/` - references `NarrativeSelection`

## Implementation Plan

### Phase 1: Remove NARRATIVE_ELEMENT Redundancy

**Files to Update:**

- `src/types/narrative.ts` - Remove `NARRATIVE_ELEMENT` constant, keep only `NARRATIVE_FORGE_NODE_TYPE` reference
- `src/types/index.ts` - Remove `NARRATIVE_ELEMENT` export
- `src/types/ui-constants.ts` - Replace `NARRATIVE_ELEMENT` with `NARRATIVE_FORGE_NODE_TYPE` or `FORGE_NODE_TYPE`
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/hooks/useNarrativePathHighlighting.ts` - Replace `NARRATIVE_ELEMENT` with `FORGE_NODE_TYPE`
- `src/components/forge/events/events.ts` - Replace `NARRATIVE_ELEMENT` with `FORGE_NODE_TYPE`

**Rationale**: `NARRATIVE_ELEMENT` duplicates `FORGE_NODE_TYPE` values. We already have `NARRATIVE_FORGE_NODE_TYPE` as a subset constant for narrative-specific types.

### Phase 2: Migrate from NODE_TYPE to FORGE_NODE_TYPE

**Files to Update:**

- `src/lib/yarn-converter.ts` - Replace `NODE_TYPE.NPC` → `FORGE_NODE_TYPE.CHARACTER`, `NODE_TYPE.PLAYER` → `FORGE_NODE_TYPE.PLAYER`, etc.
- `src/lib/yarn-runner/node-processor.ts` - Replace `NODE_TYPE` with `FORGE_NODE_TYPE`
- `src/types/ui-constants.ts` - Remove `NODE_TYPE` import, use `FORGE_NODE_TYPE`
- `src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/PlayerEdgeContextMenu.tsx` - Replace `NODE_TYPE` with `FORGE_NODE_TYPE`

**Note**: `NODE_TYPE` in `constants.ts` may still be needed for backward compatibility or legacy code. Mark as deprecated if keeping.

### Phase 3: Remove Deleted Type References

**Files to Fix:**

- `src/components/forge/store/ui/createForgeUIStore.tsx` - Remove `NarrativeSelection` import and parameter
- `src/components/forge/store/ui/slices/narrativeGraph.slice.ts` - Remove `NarrativeSelection` type, replace with simple selection state or remove entirely
- `src/components/ForgeWorkspace/components/PlayModal.tsx` - Remove `StoryThread` import, simplify to just take `graph: ForgeGraphDoc`
- `src/components/ForgeWorkspace/hooks/useStoryletManagement.ts` - Remove or refactor (pools are gone)
- `src/utils/narrative-converter.ts` - Check if `StoryThread` is still needed or should be replaced

**Rationale**: These types were removed as part of the flow-first paradigm. Components should work directly with `ForgeGraphDoc`.

### Phase 4: Fix PlayModal

**File**: `src/components/ForgeWorkspace/components/PlayModal.tsx`

**Changes**:

- Remove `narrativeThread: StoryThread` prop
- Simplify to just take `graph: ForgeGraphDoc`
- Update `PlayView` component call to not pass `narrativeThread`

### Phase 5: Update Documentation

**Files to Update**:

- `agents.md` - Document the consolidated type system
- `README.md` - Update examples to use `FORGE_NODE_TYPE`
- Add clear paradigm documentation:
  - **Node Types**: Always use `FORGE_NODE_TYPE` constants, never string literals
  - **Narrative Types**: Use `NARRATIVE_FORGE_NODE_TYPE` for narrative-specific subsets
  - **Graph Types**: `ForgeGraphDoc` is the source of truth, not `DialogueTree` or `StoryThread`
  - **Type Independence**: Library types are independent from host app types

**Note**: Documentation updates will be iterative over multiple PRs as we refine the paradigms.

## File Structure & Paradigm Summary

### Type Hierarchy

```
FORGE_NODE_TYPE (all node types)
├── NARRATIVE_FORGE_NODE_TYPE (subset for narrative graphs)
│   ├── ACT
│   ├── CHAPTER
│   ├── PAGE
│   ├── STORYLET
│   ├── DETOUR
│   └── CONDITIONAL
└── Storylet-specific types
    ├── CHARACTER
    ├── PLAYER
    └── CONDITIONAL
```

### Component Structure

```
ForgeWorkspace (root)
├── ForgeWorkspaceStore (domain state)
│   ├── graph.slice (ForgeGraphDoc cache)
│   ├── project.slice (selected project)
│   └── viewState.slice (UI state)
├── ForgeUIStore (legacy UI state - may need deprecation)
└── GraphEditors
    ├── ForgeNarrativeGraphEditor (uses FORGE_NODE_TYPE for ACT/CHAPTER/PAGE)
    └── ForgeStoryletGraphEditor (uses FORGE_NODE_TYPE for CHARACTER/PLAYER)
```

## Implementation Order

1. **Phase 1**: Remove NARRATIVE_ELEMENT (cleanest, least dependencies)
2. **Phase 2**: Migrate NODE_TYPE to FORGE_NODE_TYPE (affects yarn converter/runner)
3. **Phase 3**: Remove deleted type references (fixes import errors)
4. **Phase 4**: Fix PlayModal (depends on Phase 3)
5. **Phase 5**: Update documentation (ongoing, iterative)

## Testing Strategy

- Run TypeScript compiler to catch all type errors
- Verify yarn import/export still works after NODE_TYPE migration
- Test PlayModal with simplified props
- Verify no runtime errors from removed type references

## Notes

- This cleanup will be iterative over multiple PRs
- Documentation will be updated progressively as paradigms stabilize
- Some legacy code (like old UI store) may need deprecation rather than immediate removal
- Keep backward compatibility in mind for any public APIs