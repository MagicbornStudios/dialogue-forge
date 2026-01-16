# 01 - Boundary Violations

## Critical Boundary Violations Found

### 1. Host Imports by Non-Host Code

**🚨 HIGH PRIORITY - Blocker for Package Boundaries**

#### ForgeWorkspace Importing Host Modules
- **File**: `src/components/ForgeWorkspace/components/ForgeProjectSwitcher.tsx`
- **Violation**: `import { useProjects, useCreateProject, type ProjectDocument } from '@/app/lib/forge/queries';`
- **Impact**: Forge workspace directly imports host-side query utilities
- **Recommendation**: Move queries to shared library or create abstraction layer

### 2. CopilotKit Integration Architecture

**✅ POSITIVE FINDING - Well-Structured Integration**

#### CopilotKit Integration Points
**Host Layer**:
- `app/api/copilotkit/route.ts` - CopilotKit runtime with OpenRouter
- **Pattern**: Host owns runtime, domains own actions

**Shared Core Layer**:
- `src/ai/copilotkit/` - Shared CopilotKit integration infrastructure
- **Files**: 8 files (providers, hooks, actions)
- **Pattern**: Proper layer separation

**Domain-Specific Layers**:
- `src/forge/copilotkit/` - Forge-specific CopilotKit actions (9 files)
- `src/writer/copilotkit/` - Writer-specific CopilotKit actions (7 files)
- **Pattern**: Clean domain separation

#### CopilotKit Integration Quality Assessment
- **Provider Architecture**: Clean separation with workspace providers
- **Action System**: Domain-specific actions with proper typing
- **Context Integration**: Well-designed state → AI context flow
- **Boundary Adherence**: No cross-domain CopilotKit dependencies

### 3. Library Components Importing UI/Store

**🔶 MEDIUM PRIORITY - Architecture Concern**

#### Yarn Converter Importing Store Types
- **Files**: 
  - `src/lib/yarn-converter/types.ts`
  - `src/lib/yarn-converter/workspace-context.ts`
- **Violations**: 
  ```typescript
  import type { ForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';
  ```
- **Impact**: Core library (yarn-converter) depends on specific workspace store implementation
- **Recommendation**: Extract shared interfaces to prevent tight coupling

#### CopilotKit Workspace Provider Coupling
- **File**: `src/ai/copilotkit/providers/CopilotKitWorkspaceProvider.tsx`
- **Current Pattern**: Direct import of `WriterWorkspaceState` type
- **Assessment**: ✅ **Appropriate** - Shared infrastructure intentionally coupled to domain interfaces
- **Future Consideration**: Generic workspace provider for reuse across domains

### 4. Cross-Deep Relative Imports

**🔶 MEDIUM PRIORITY - Maintainability Issue**

#### Excessive Relative Depth in Components
Multiple files using deep relative imports (`../../../types/`, `../../../../../`):

**ForgeWorkspace Components**:
- `src/components/ForgeWorkspace/components/FlagManagerModal.tsx`
- `src/components/ForgeWorkspace/components/PlayModal.tsx`
- Multiple other ForgeWorkspace components

**Pattern**: `import { X } from "../../../types/constants"`
- **Impact**: Fragile imports that break with file moves
- **Recommendation**: Use absolute imports (`@/src/types/constants`)

**CopilotKit Files**: Generally well-structured with proper imports
- **Exception**: Some deep relative imports in action files
- **Pattern**: Importing from `../../constants/` or `../../../types/`
- **Impact**: Minor maintainability concern

### 5. @/src Import Patterns

**🔶 LOW PRIORITY - Style Consistency**

#### Inconsistent Import Patterns
Multiple files mixing absolute and relative imports:

**Examples**:
- `src/components/forge/forge-data-adapter/forge-data-adapter.ts`
- `src/components/ForgeWorkspace/components/ForgeSidebar.tsx`
- Many CopilotKit files using `@/forge/` and `@/writer/` patterns

**Pattern**: `import { X } from '@/src/components/ui/button';`
- **Impact**: Inconsistent style, potential confusion
- **Recommendation**: Standardize on either relative or absolute imports

## New CopilotKit-Specific Findings

### ✅ Well-Designed CopilotKit Architecture

#### Proper Layering
```
Host (app/api/copilotkit/) → Shared Core (src/ai/copilotkit/) → Domain Layers (src/*/copilotkit/)
```

#### Domain Separation
- **Forge Actions**: 9 files in `src/forge/copilotkit/`
- **Writer Actions**: 7 files in `src/writer/copilotkit/`
- **Shared Infrastructure**: 8 files in `src/ai/copilotkit/`
- **No Cross-Pollution**: Forge doesn't import Writer CopilotKit files (and vice versa)

#### Clean Integration Points
- **Runtime**: Host-only (`app/api/copilotkit/route.ts`)
- **Providers**: Shared core with domain-specific implementations
- **Actions**: Domain-specific with shared base patterns
- **Hooks**: Domain-specific with shared utilities

### ⚠️ Minor CopilotKit Improvements Needed

#### Import Path Consistency
- **Current**: Mix of `@/forge/`, `@/writer/`, and relative imports
- **Recommendation**: Standardize on domain-specific path aliases
- **Target**: `@forge/copilotkit/`, `@writer/copilotkit/`, `@ai/copilotkit/`

#### Generic Provider Opportunities
- **Current**: `CopilotKitWorkspaceProvider` typed for `WriterWorkspaceState`
- **Opportunity**: Generic workspace provider for cross-domain reuse
- **Implementation**: Could support both Forge and Writer workspace stores

## Boundary Categories Analysis

### Clear Boundaries (✅)
- **Host ↔ AI Runtime**: Clean separation, host owns runtime
- **Forge ↔ Writer**: No cross-imports in CopilotKit integration
- **Domain Actions**: Proper separation with domain-specific implementations
- **Core Infrastructure**: Shared CopilotKit code well-isolated

### Violated Boundaries (❌)
- **Host Import**: ForgeProjectSwitcher still imports host queries
- **Library Coupling**: Yarn converter coupling to Forge store
- **Deep Relatives**: Maintainability issues across all areas

### Style Inconsistencies (⚠️)
- **Import Patterns**: Mixed absolute/relative imports including CopilotKit files
- **Path Depth**: Deep relative imports in action files
- **Naming**: Inconsistent naming patterns across domains

## Updated Blocking Issues for Package Separation

### Critical Blockers
1. **ForgeProjectSwitcher.tsx** - Host import issue (unchanged)
2. **Yarn converter** - Store coupling (unchanged)

### New CopilotKit Considerations
1. **Generic Provider** - Optional enhancement for better code reuse
2. **Path Consistency** - Standardize CopilotKit import patterns
3. **Action Patterns** - Consider shared action base classes

## Enforcement Recommendations

### ESLint Rules to Add
```javascript
// Disallow host imports in src/
{
  'no-restricted-imports': ['error', {
    patterns: ['@/app/*']
  }]
}

// Disallow cross-domain CopilotKit imports
{
  'no-restricted-imports': ['error', {
    patterns: [
      '@/src/forge/copilotkit/*',
      '@/src/writer/copilotkit/*'
    ]
  }],
  // Apply to opposite domain directories
}

// Enforce consistent CopilotKit import paths
{
  'no-restricted-imports': ['error', {
    patterns: ['@/ai/copilotkit/*'],
    'paths': ['@forge/copilotkit/*', '@writer/copilotkit/*']
  }]
}
```

### Path Aliases for CopilotKit
```json
{
  "paths": {
    "@ai/copilotkit/*": ["./src/ai/copilotkit/*"],
    "@forge/copilotkit/*": ["./src/forge/copilotkit/*"],
    "@writer/copilotkit/*": ["./src/writer/copilotkit/*"]
  }
}
```

## Next Steps

### Before Any File Moves
1. **Resolve Critical Blocking Violations**:
   - Fix ForgeProjectSwitcher host dependency
   - Decouple yarn converter from Forge store
   
2. **Standardize CopilotKit Imports**:
   - Update all CopilotKit files to use domain-specific aliases
   - Fix deep relative imports in action files

### During Reorganization
1. **Maintain CopilotKit Architecture**:
   - Preserve the well-designed layering
   - Keep domain separation intact
   - Update import paths systematically

2. **Consider Generic Provider**:
   - Optional: Create generic workspace provider
   - Maintain existing functionality
   - Don't break existing typed providers

### After Reorganization
1. **Validate CopilotKit Integration**:
   - Test all CopilotKit functionality
   - Verify AI actions work in both domains
   - Ensure no regressions in AI features

## Assessment Summary

**Positive Discovery**: CopilotKit integration is **exceptionally well-architected** with proper domain separation, clean layering, and no cross-domain violations. The integration serves as a model for how other cross-cutting concerns should be implemented.

**Primary Concern**: Original boundary violations remain unchanged (ForgeProjectSwitcher, yarn converter). CopilotKit itself introduces no new boundary violations.

**Recommendation**: Preserve CopilotKit architecture while fixing original violations and standardizing import patterns.