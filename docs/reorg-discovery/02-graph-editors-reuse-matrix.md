# 02 - GraphEditors Reuse Matrix

## Executive Summary

The GraphEditors architecture is **well-structured with clear separation** between shared and editor-specific components. The shared layer provides a solid foundation that both Narrative and Storylet editors leverage effectively.

## Component Usage Matrix

### Shared Components (Used by Both Editors)

| Component | Used By Narrative | Used By Storylet | Location | Notes |
|-----------|------------------|------------------|----------|-------|
| `ConditionalNodeV2` | ✅ | ✅ | `shared/Nodes/ConditionalNode/` | Core conditional logic node |
| `DetourNode` | ✅ | ✅ | `shared/Nodes/DetourNode/` | Flow control node |
| `ForgeEdge` | ✅ | ✅ | `shared/Edges/` | Standard edge component |
| `GraphLayoutControls` | ✅ | ✅ | `shared/` | Layout strategy selector |
| `GraphLeftToolbar` | ✅ | ✅ | `shared/` | Main toolbar |
| `GraphMiniMap` | ✅ | ✅ | `shared/` | React Flow minimap |
| `NodeEditor` | ✅ | ✅ | `shared/NodeEditor/` | Node editing modal |
| `PlayView` | ✅ | ✅ | `shared/` | Playback mode view |
| `YarnView` | ✅ | ✅ | `shared/` | Yarn format view |

### Shared Supporting Components

| Component | Used By Narrative | Used By Storylet | Location | Notes |
|-----------|------------------|------------------|----------|-------|
| `ContextMenuBase` | ✅ | ✅ | `shared/` | Context menu base |
| `EdgeIcon` | ✅ | ✅ | `shared/` | Edge styling icons |
| `EdgeSVGElements` | ✅ | ✅ | `shared/` | Edge animations |
| `FlagSelector` | ✅ | ✅ | `shared/` | Flag autocomplete |
| `ConditionAutocomplete` | ✅ | ✅ | ✅ | `shared/` | Condition building |
| `NextNodeSelector` | - | ✅ | `shared/NodeEditor/` | Node selection |

### Narrative-Exclusive Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ActNode` | `ForgeNarrativeGraphEditor/components/ActNode/` | Narrative act container |
| `ChapterNode` | `ForgeNarrativeGraphEditor/components/ChapterNode/` | Chapter organization |
| `PageNode` | `ForgeNarrativeGraphEditor/components/PageNode/` | Content pages |
| `NarrativeGraphEditorPaneContextMenu` | `ForgeNarrativeGraphEditor/components/` | Narrative-specific context menu |

### Storylet-Exclusive Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CharacterNode` | `ForgeStoryletGraphEditor/components/CharacterNode/` | Character dialogue nodes |
| `PlayerNode` | `ForgeStoryletGraphEditor/components/PlayerNode/` | Player choice nodes |
| `StoryletNode` | `ForgeStoryletGraphEditor/components/StoryletNode/` | Storylet container |
| `CharacterSelector` | `ForgeStoryletGraphEditor/components/` | Character selection UI |
| `ForgeStoryletGraphEditorPaneContextMenu` | `ForgeStoryletGraphEditor/components/` | Storylet-specific context menu |

## Shared Infrastructure Analysis

### Hooks (All Shared)
| Hook | Purpose | Used By |
|------|---------|---------|
| `useFlowPathHighlighting` | Path visualization | Both editors |
| `useEdgeDropBehavior` | Edge interaction | Both editors |
| `useForgeEditorActions` | Editor commands | Both editors |
| `useForgeEditorSession` | Session state | Both editors |
| `useForgeFlowEditorShell` | Editor shell | Both editors |
| `usePaneContextMenu` | Context menus | Both editors |
| `useReactFlowBehaviors` | React Flow config | Both editors |
| `forge-commands` | Command definitions | Both editors |

### Utilities (All Shared)
| Utility | Purpose | Domain Specificity |
|---------|---------|-------------------|
| `condition-utils.ts` | Condition logic | Generic |
| `constants.ts` | Editor constants | Generic |
| `flag-styles.ts` | Flag visual styling | Generic |
| `forge-edge-styles.ts` | Edge styling | Forge-specific |
| `layout/*` | Graph layout algorithms | Generic |

## Tiers of Sharing

### Tier 1: Feature-Shared (GraphEditors only)
**Recommendation**: Keep in `src/components/GraphEditors/shared/`

- All shared components listed above
- All hooks in `src/components/GraphEditors/hooks/`
- All utilities in `src/components/GraphEditors/utils/`

**Rationale**: These are tightly coupled to React Flow and Forge's specific node model. They're not reusable outside the Forge domain.

### Tier 2: Package-Shared (Forge UI layer)
**Current State**: No components qualify yet

**Future Candidates**:
- `FlagSelector` - Could be reused in Writer if Writer needs flag management
- `ConditionAutocomplete` - Could be reused across Forge domains

### Tier 3: Cross-Package Shared
**Current State**: None identified

**Future Considerations**:
- Layout algorithms (`utils/layout/`) - Could be shared with Writer if Writer gets graph visualization
- AI integration patterns - To be analyzed in Task 6

## Reuse Patterns Analysis

### Excellent Patterns ✅
1. **Clear separation**: Narrative vs Storylet nodes are completely separate
2. **Shared infrastructure**: Both editors leverage same hooks and utilities
3. **Consistent component structure**: Node components follow same pattern across both editors
4. **Proper abstraction**: Shared components don't make assumptions about node types

### Areas for Improvement ⚠️
1. **Deep relative imports**: Components use `../../../shared/` instead of clean imports
2. **Mixed import styles**: Some use absolute (`@/src/...`) others use relative
3. **NodeEditor coupling**: Some shared components might be too tightly coupled to Forge patterns

## Writer Workspace Reuse Potential

### High Reuse Potential
- `FlagSelector` - If Writer needs flag management
- `ConditionAutocomplete` - If Writer needs conditional content
- Layout algorithms - If Writer gets graph visualization
- React Flow patterns - If Writer needs any graph editing

### Low Reuse Potential  
- Narrative/Storylet-specific nodes - Writer domain is different
- Forge-specific edge styling - Writer likely needs different visual patterns
- PlayView/YarnView - Writer's output format will be different

## Recommendations

### Immediate Actions
1. **Fix import paths**: Replace `../../../shared/` with clean absolute imports
2. **Standardize naming**: Ensure consistent naming patterns across shared components
3. **Document contracts**: Clear interfaces for what shared components expect

### Medium Term
1. **Extract FlagSelector**: Make it domain-agnostic if Writer will use flags
2. **Create pattern library**: Formalize the shared component patterns
3. **Consider abstraction**: Evaluate if some Forge-specific patterns can be generalized

### Long Term
1. **Cross-package sharing**: Plan which utilities could be shared with Writer
2. **AI integration**: Plan how AI features can leverage shared infrastructure
3. **Testing strategy**: Implement testing for shared components

## Migration Safety

### Low Risk
- All shared components are already well-isolated
- Clear separation between Narrative and Storylet domains
- Shared infrastructure is already generic

### Medium Risk  
- Import path updates needed
- Some components might be more Forge-coupled than apparent
- Need to verify shared components don't have hidden dependencies

### Migration Strategy
1. Keep shared structure in `GraphEditors/shared/`
2. Update import paths to be cleaner
3. Extract cross-domain reusable components when Writer integration is planned
4. Maintain clear documentation of what can be shared vs what's domain-specific